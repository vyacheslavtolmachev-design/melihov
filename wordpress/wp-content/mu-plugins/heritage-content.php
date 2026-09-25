<?php
/**
 * Plugin Name: Сады Наследия — модель контента
 * Description: Типы записей, таксономии, редирект витрины и инвалидация кеша Next.js.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Настройки приходят из окружения контейнера. Константа wp-config имеет приоритет,
 * но в контексте WP-CLI её может не быть, поэтому есть запасной путь через getenv.
 */
function heritage_config( $name ) {
	if ( defined( $name ) ) {
		$value = constant( $name );
		if ( $value ) {
			return $value;
		}
	}

	$value = getenv( $name );

	return $value ? $value : '';
}

add_action(
	'init',
	function () {
		register_post_type(
			'variety',
			array(
				'labels'              => array(
					'name'          => 'Сорта',
					'singular_name' => 'Сорт',
					'add_new_item'  => 'Добавить сорт',
					'edit_item'     => 'Редактировать сорт',
					'search_items'  => 'Искать сорта',
				),
				'public'              => true,
				'menu_icon'           => 'dashicons-palmtree',
				'menu_position'       => 20,
				'supports'            => array( 'title', 'editor', 'excerpt', 'thumbnail', 'custom-fields' ),
				'has_archive'         => true,
				'rewrite'             => array( 'slug' => 'catalog' ),
				'show_in_rest'        => true,
				'show_in_graphql'     => true,
				'graphql_single_name' => 'variety',
				'graphql_plural_name' => 'varieties',
			)
		);

		$taxonomies = array(
			'culture'  => array( 'Культуры', 'Культура', 'culture', 'cultures', true ),
			'ripening' => array( 'Сроки созревания', 'Срок созревания', 'ripening', 'ripenings', false ),
			'region'   => array( 'Регионы', 'Регион', 'region', 'regions', false ),
			'rootstock' => array( 'Подвои', 'Подвой', 'rootstock', 'rootstocks', false ),
		);

		foreach ( $taxonomies as $slug => $config ) {
			list( $plural, $single, $graphql_single, $graphql_plural, $hierarchical ) = $config;

			register_taxonomy(
				$slug,
				array( 'variety' ),
				array(
					'labels'              => array(
						'name'          => $plural,
						'singular_name' => $single,
					),
					'public'              => true,
					'hierarchical'        => $hierarchical,
					'show_admin_column'   => true,
					'show_in_rest'        => true,
					'show_in_graphql'     => true,
					'graphql_single_name' => $graphql_single,
					'graphql_plural_name' => $graphql_plural,
				)
			);
		}
	}
);

/**
 * Фронтенд WordPress не используется: витрина живёт на Next.js.
 * Всё, кроме админки, API и служебных путей, уводим на витрину.
 */
add_action(
	'template_redirect',
	function () {
		if ( is_admin() || wp_doing_ajax() || is_feed() || is_robots() ) {
			return;
		}

		if ( defined( 'REST_REQUEST' ) && REST_REQUEST ) {
			return;
		}

		$frontend_url = heritage_config( 'FRONTEND_PUBLIC_URL' );

		if ( ! $frontend_url ) {
			return;
		}

		$request_uri = isset( $_SERVER['REQUEST_URI'] ) ? wp_unslash( $_SERVER['REQUEST_URI'] ) : '/';

		$passthrough = array( '/graphql', '/wp-json', '/wp-admin', '/wp-login.php', '/wp-content', '/wp-includes' );
		foreach ( $passthrough as $prefix ) {
			if ( 0 === strpos( $request_uri, $prefix ) ) {
				return;
			}
		}

		wp_safe_redirect( rtrim( $frontend_url, '/' ) . $request_uri, 302 );
		exit;
	}
);

add_filter(
	'allowed_redirect_hosts',
	function ( $hosts ) {
		$frontend_url = heritage_config( 'FRONTEND_PUBLIC_URL' );

		if ( $frontend_url ) {
			$host = wp_parse_url( $frontend_url, PHP_URL_HOST );
			if ( $host ) {
				$hosts[] = $host;
			}
		}

		return $hosts;
	}
);

/**
 * Сбрасывает кеш витрины, иначе правки в админке не видны без перезапуска Next.js.
 */
function heritage_ping_revalidate( $reason ) {
	$frontend_url = heritage_config( 'FRONTEND_INTERNAL_URL' );
	$secret       = heritage_config( 'REVALIDATE_SECRET' );

	if ( ! $frontend_url || ! $secret ) {
		return;
	}

	// В контексте WP-CLI процесс завершается сразу, поэтому неблокирующий запрос теряется.
	$blocking = ! ( defined( 'WP_CLI' ) && WP_CLI );

	wp_remote_post(
		rtrim( $frontend_url, '/' ) . '/api/revalidate',
		array(
			'timeout'  => 5,
			'blocking' => $blocking,
			'headers'  => array( 'Content-Type' => 'application/json' ),
			'body'     => wp_json_encode(
				array(
					'secret' => $secret,
					'reason' => $reason,
				)
			),
		)
	);
}

add_action(
	'save_post',
	function ( $post_id, $post ) {
		if ( wp_is_post_revision( $post_id ) || wp_is_post_autosave( $post_id ) ) {
			return;
		}

		if ( 'auto-draft' === $post->post_status ) {
			return;
		}

		heritage_ping_revalidate( 'save_post:' . $post->post_type );
	},
	10,
	2
);

add_action(
	'deleted_post',
	function () {
		heritage_ping_revalidate( 'deleted_post' );
	}
);

foreach ( array( 'created_term', 'edited_term', 'delete_term' ) as $term_hook ) {
	add_action(
		$term_hook,
		function () {
			heritage_ping_revalidate( 'term_changed' );
		}
	);
}
