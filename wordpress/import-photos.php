<?php
/**
 * Фотографии сортов из wordpress/catalog/photos.tsv → featured image записей variety.
 * Запускается через wp eval-file — см. import-photos.sh.
 *
 * Идемпотентно: вложение помечается слагом сорта и хешем файла, повторный прогон
 * ничего не загружает заново. Заменённая фотография сорта удаляется из медиатеки;
 * иллюстрации и вложения, загруженные руками, скрипт не трогает — у них нет метки.
 */

if ( ! defined( 'WP_CLI' ) || ! WP_CLI ) {
	exit( 1 );
}

require_once ABSPATH . 'wp-admin/includes/file.php';
require_once ABSPATH . 'wp-admin/includes/media.php';
require_once ABSPATH . 'wp-admin/includes/image.php';

// В контейнере каталог с данными смонтирован в /catalog, при запуске из репозитория
// файлы лежат рядом со скриптом.
$dir = getenv( 'CATALOG_DIR' );

if ( ! $dir ) {
	$dir = is_readable( __DIR__ . '/catalog/photos.tsv' ) ? __DIR__ . '/catalog' : '/catalog';
}

$path = "$dir/photos.tsv";

if ( ! is_readable( $path ) ) {
	WP_CLI::error( "не найден файл данных: $path" );
}

$lines  = file( $path, FILE_IGNORE_NEW_LINES );
$header = explode( "\t", array_shift( $lines ) );

$uploaded = 0;
$changed  = 0;
$removed  = 0;
$skipped  = 0;

foreach ( $lines as $number => $line ) {
	if ( '' === trim( $line ) ) {
		continue;
	}

	$values = array_pad( explode( "\t", $line ), count( $header ), '' );
	$row    = array_map( 'trim', array_combine( $header, array_slice( $values, 0, count( $header ) ) ) );
	$slug   = $row['slug'];
	$file   = "$dir/photos/$slug.jpg";

	if ( ! is_readable( $file ) ) {
		WP_CLI::warning( 'строка ' . ( $number + 2 ) . ": нет файла photos/$slug.jpg" );
		$skipped++;
		continue;
	}

	$posts = get_posts(
		array(
			'post_type'        => 'variety',
			'name'             => $slug,
			'post_status'      => 'any',
			'posts_per_page'   => 1,
			'fields'           => 'ids',
			'suppress_filters' => false,
		)
	);

	if ( ! $posts ) {
		WP_CLI::warning( "сорт $slug не найден — сначала импорт каталога" );
		$skipped++;
		continue;
	}

	$post_id = $posts[0];
	$hash    = hash_file( 'sha256', $file );
	$current = 0;
	$stale   = array();

	$attachments = get_posts(
		array(
			'post_type'      => 'attachment',
			'post_status'    => 'inherit',
			'posts_per_page' => -1,
			'fields'         => 'ids',
			'meta_key'       => '_heritage_photo',
			'meta_value'     => $slug,
		)
	);

	foreach ( $attachments as $attachment_id ) {
		if ( ! $current && get_post_meta( $attachment_id, '_heritage_photo_sha', true ) === $hash ) {
			$current = $attachment_id;
		} else {
			$stale[] = $attachment_id;
		}
	}

	if ( ! $current ) {
		// media_handle_sideload перемещает файл, а /catalog смонтирован только на чтение.
		$tmp = wp_tempnam( "$slug.jpg" );
		copy( $file, $tmp );

		$current = media_handle_sideload(
			array(
				'name'     => "$slug.jpg",
				'tmp_name' => $tmp,
			),
			$post_id,
			$row['alt']
		);

		if ( is_wp_error( $current ) ) {
			@unlink( $tmp );
			WP_CLI::warning( "сорт $slug: " . $current->get_error_message() );
			$skipped++;
			continue;
		}

		update_post_meta( $current, '_heritage_photo', $slug );
		update_post_meta( $current, '_heritage_photo_sha', $hash );
		WP_CLI::log( "[photos] $slug: загружено вложение $current" );
		$uploaded++;
	}

	// alt принадлежит файлу: правка в photos.tsv доходит до медиатеки.
	if ( get_post_meta( $current, '_wp_attachment_image_alt', true ) !== $row['alt'] ) {
		update_post_meta( $current, '_wp_attachment_image_alt', $row['alt'] );
		$changed++;
	}

	// Фотография сорта главнее иллюстрации: если featured image была иллюстрация,
	// она остаётся в медиатеке, но с карточки уходит.
	if ( (int) get_post_thumbnail_id( $post_id ) !== (int) $current ) {
		set_post_thumbnail( $post_id, $current );
		WP_CLI::log( "[photos] $slug: фото стало обложкой сорта" );
		$changed++;
	}

	foreach ( $stale as $attachment_id ) {
		wp_delete_attachment( $attachment_id, true );
		WP_CLI::log( "[photos] $slug: удалено прежнее фото $attachment_id" );
		$removed++;
	}
}

// set_post_thumbnail и правка alt не вызывают save_post — кеш витрины сбрасываем сами.
if ( ( $uploaded || $changed || $removed ) && function_exists( 'heritage_ping_revalidate' ) ) {
	heritage_ping_revalidate( 'import-photos' );
}

WP_CLI::success( "фото загружено: $uploaded, изменений: $changed, удалено прежних: $removed, пропущено: $skipped" );
