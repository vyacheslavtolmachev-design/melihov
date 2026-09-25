<?php
/**
 * Импорт каталога сортов из wordpress/catalog/varieties.tsv.
 * Запускается через wp eval-file — см. import-catalog.sh.
 *
 * Один прогон PHP вместо тысячи вызовов wp в shell: сортов больше сотни,
 * а у каждого — таксономии и шесть полей ACF.
 */

if ( ! defined( 'WP_CLI' ) || ! WP_CLI ) {
	exit( 1 );
}

// wp eval-file отдаёт скрипту только позиционные аргументы, поэтому обёртка
// превращает --prune в слово prune.
$prune = in_array( 'prune', (array) $args, true );

/** Культуры каталога. Слаги совпадают с frontend/lib/catalog.ts и media-fallbacks.ts. */
$cultures = array(
	'apple'          => 'Яблони',
	'columnar-apple' => 'Колоновидные яблони',
	'pear'           => 'Груши',
	'cherry'         => 'Вишни',
	'sweet-cherry'   => 'Черешни',
	'felt-cherry'    => 'Войлочная вишня',
	'plum'           => 'Сливы',
	'peach'          => 'Персики',
	'apricot'        => 'Абрикосы',
	'currant'        => 'Смородина',
	'gooseberry'     => 'Крыжовник',
	'raspberry'      => 'Малина',
	'josta'          => 'Йошта',
);

$taxonomies = array(
	'culture'   => $cultures,
	'ripening'  => array(
		'summer' => 'Летний',
		'autumn' => 'Осенний',
		'winter' => 'Зимний',
	),
	'region'    => array(
		'middle'    => 'Средняя полоса',
		'chernozem' => 'Чернозёмье',
		'south'     => 'Юг России',
	),
	'rootstock' => array(
		'seed'       => 'Семенной',
		'semi-dwarf' => 'Полукарликовый',
		'dwarf'      => 'Карликовый',
	),
);

/** Колонка TSV => ключ поля ACF. Значение поля признаётся только вместе с парной мета-записью ключа. */
$acf_fields = array(
	'price_retail'    => 'field_price_retail',
	'price_wholesale' => 'field_price_wholesale',
	'wholesale_min'   => 'field_wholesale_min',
	'sapling_age'     => 'field_sapling_age',
	'availability'    => 'field_availability',
	'planting_rules'  => 'field_planting_rules',
);

$term_columns = array( 'culture', 'ripening', 'region', 'rootstock' );

// --- таксономии ---------------------------------------------------------

foreach ( $taxonomies as $taxonomy => $terms ) {
	foreach ( $terms as $slug => $name ) {
		if ( get_term_by( 'slug', $slug, $taxonomy ) ) {
			continue;
		}

		$created = wp_insert_term( $name, $taxonomy, array( 'slug' => $slug ) );

		if ( is_wp_error( $created ) ) {
			WP_CLI::warning( "термин $taxonomy/$slug: " . $created->get_error_message() );
		}
	}
}

WP_CLI::log( '[import] таксономии готовы' );

// --- разбор TSV ---------------------------------------------------------

// В контейнере каталог с данными смонтирован в /catalog, при запуске из репозитория
// файл лежит рядом со скриптом.
$path = getenv( 'CATALOG_TSV' );

if ( ! $path ) {
	$path = is_readable( __DIR__ . '/catalog/varieties.tsv' )
		? __DIR__ . '/catalog/varieties.tsv'
		: '/catalog/varieties.tsv';
}

if ( ! is_readable( $path ) ) {
	WP_CLI::error( "не найден файл данных: $path" );
}

$lines = file( $path, FILE_IGNORE_NEW_LINES );
$header = explode( "\t", array_shift( $lines ) );
$rows   = array();

foreach ( $lines as $number => $line ) {
	if ( '' === trim( $line ) ) {
		continue;
	}

	$values = explode( "\t", $line );

	// Пустые хвостовые колонки в TSV можно не дописывать — добираем их сами.
	$values = array_pad( array_slice( $values, 0, count( $header ) ), count( $header ), '' );
	$row    = array_map( 'trim', array_combine( $header, $values ) );

	if ( '' === $row['slug'] || '' === $row['title'] ) {
		WP_CLI::error( 'строка ' . ( $number + 2 ) . ': пустой slug или title' );
	}

	if ( isset( $rows[ $row['slug'] ] ) ) {
		WP_CLI::error( 'строка ' . ( $number + 2 ) . ": слаг {$row['slug']} повторяется" );
	}

	$rows[ $row['slug'] ] = $row;
}

// --- сорта --------------------------------------------------------------

$created = 0;
$updated = 0;

foreach ( $rows as $slug => $row ) {
	$existing = get_posts(
		array(
			'post_type'        => 'variety',
			'name'             => $slug,
			'post_status'      => 'any',
			'posts_per_page'   => 1,
			'suppress_filters' => false,
		)
	);

	// Краткое описание принадлежит файлу целиком: пустая колонка стирает текст.
	// Иначе в каталоге навсегда остаётся то, что когда-то занесли мимо файла.
	// Полное описание (post_content) и фотография правятся в админке — их не трогаем.
	$postarr = array(
		'post_type'    => 'variety',
		'post_title'   => $row['title'],
		'post_name'    => $slug,
		'post_status'  => 'publish',
		'post_excerpt' => $row['excerpt'],
	);

	if ( $existing ) {
		$post_id             = $existing[0]->ID;
		$postarr['ID']       = $post_id;
		$result              = wp_update_post( $postarr, true );
		$updated++;
	} else {
		$result  = wp_insert_post( $postarr, true );
		$post_id = $result;
		$created++;
	}

	if ( is_wp_error( $result ) ) {
		WP_CLI::error( "сорт $slug: " . $result->get_error_message() );
	}

	foreach ( $term_columns as $taxonomy ) {
		if ( '' === $row[ $taxonomy ] ) {
			wp_set_object_terms( $post_id, array(), $taxonomy );
			continue;
		}

		if ( ! isset( $taxonomies[ $taxonomy ][ $row[ $taxonomy ] ] ) ) {
			WP_CLI::error( "сорт $slug: неизвестный термин {$taxonomy}={$row[ $taxonomy ]}" );
		}

		wp_set_object_terms( $post_id, $row[ $taxonomy ], $taxonomy );
	}

	foreach ( $acf_fields as $name => $key ) {
		$value = isset( $row[ $name ] ) ? $row[ $name ] : '';

		// Пустую колонку не пишем, а стираем: GraphQL должен отдать null,
		// на этом держится «по запросу» в formatPrice на витрине.
		if ( '' === $value ) {
			delete_post_meta( $post_id, $name );
			delete_post_meta( $post_id, '_' . $name );
			continue;
		}

		update_post_meta( $post_id, $name, $value );
		update_post_meta( $post_id, '_' . $name, $key );
	}
}

WP_CLI::log( "[import] сортов создано: $created, обновлено: $updated" );

// --- удаление лишнего ---------------------------------------------------

if ( $prune ) {
	$stale = get_posts(
		array(
			'post_type'        => 'variety',
			'post_status'      => 'any',
			'posts_per_page'   => -1,
			'suppress_filters' => false,
		)
	);

	$removed = 0;

	foreach ( $stale as $post ) {
		if ( isset( $rows[ $post->post_name ] ) ) {
			continue;
		}

		wp_delete_post( $post->ID, true );
		WP_CLI::log( "[import] удалён лишний сорт: {$post->post_title} ({$post->post_name})" );
		$removed++;
	}

	WP_CLI::log( "[import] удалено сортов вне файла: $removed" );
}

wp_cache_flush();

if ( function_exists( 'heritage_ping_revalidate' ) ) {
	heritage_ping_revalidate( 'import-catalog' );
}

WP_CLI::success( 'каталог импортирован: ' . count( $rows ) . ' сортов' );
