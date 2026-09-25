<?php
/**
 * Plugin Name: Сады Наследия — поля сорта
 * Description: Характеристики сорта на ACF, зарегистрированные кодом и доступные в WPGraphQL.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action(
	'acf/init',
	function () {
		if ( ! function_exists( 'acf_add_local_field_group' ) ) {
			return;
		}

		acf_add_local_field_group(
			array(
				'key'                 => 'group_variety_specs',
				'title'               => 'Характеристики сорта',
				'menu_order'          => 0,
				'position'            => 'normal',
				'style'               => 'default',
				'active'              => true,
				'show_in_graphql'     => 1,
				'graphql_field_name'  => 'specs',
				'location'            => array(
					array(
						array(
							'param'    => 'post_type',
							'operator' => '==',
							'value'    => 'variety',
						),
					),
				),
				'fields'              => array(
					array(
						'key'           => 'field_price_retail',
						'label'         => 'Розничная цена, ₽',
						'name'          => 'price_retail',
						'type'          => 'number',
						'min'           => 0,
						'step'          => 10,
						'wrapper'       => array( 'width' => '33' ),
						'show_in_graphql' => 1,
					),
					array(
						'key'           => 'field_price_wholesale',
						'label'         => 'Оптовая цена, ₽',
						'name'          => 'price_wholesale',
						'type'          => 'number',
						'min'           => 0,
						'step'          => 10,
						'wrapper'       => array( 'width' => '33' ),
						'show_in_graphql' => 1,
					),
					array(
						'key'           => 'field_wholesale_min',
						'label'         => 'Опт от, шт',
						'name'          => 'wholesale_min',
						'type'          => 'number',
						'min'           => 1,
						'default_value' => 50,
						'wrapper'       => array( 'width' => '34' ),
						'show_in_graphql' => 1,
					),
					array(
						'key'           => 'field_sapling_age',
						'label'         => 'Возраст саженца',
						'name'          => 'sapling_age',
						'type'          => 'text',
						'placeholder'   => 'Двухлетка',
						'wrapper'       => array( 'width' => '50' ),
						'show_in_graphql' => 1,
					),
					array(
						'key'           => 'field_availability',
						'label'         => 'Наличие',
						'name'          => 'availability',
						'type'          => 'select',
						'default_value' => 'in_stock',
						'wrapper'       => array( 'width' => '50' ),
						'choices'       => array(
							'in_stock' => 'В наличии',
							'preorder' => 'Под заказ',
							'sold_out' => 'Нет в сезоне',
						),
						'show_in_graphql' => 1,
					),
					array(
						'key'           => 'field_planting_rules',
						'label'         => 'Правила посадки',
						'name'          => 'planting_rules',
						'type'          => 'textarea',
						'rows'          => 6,
						'instructions'  => 'Схема посадки, глубина, полив, что важно в первый сезон.',
						'show_in_graphql' => 1,
					),
				),
			)
		);
	}
);
