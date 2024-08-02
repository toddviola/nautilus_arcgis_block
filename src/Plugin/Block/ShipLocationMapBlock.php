<?php declare(strict_types = 1);

namespace Drupal\nautilus_arcgis_block\Plugin\Block;

use Drupal\Core\Block\BlockBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\taxonomy\Entity\Term;

/**
 * Provides a ship location map block.
 *
 * @Block(
 *   id = "nautilus_arcgis_block_ship_location_map",
 *   admin_label = @Translation("Ship location map"),
 *   category = @Translation("ArcGIS map"),
 * )
 */
final class ShipLocationMapBlock extends BlockBase {

  /**
   * {@inheritdoc}
   */
  public function blockForm($form, FormStateInterface $form_state) {

    $form['show_ship_track'] = [
      '#type'          => 'checkbox',
      '#title'         => t('Display ship track on map'),
      '#default_value' => $this->configuration['show_ship_track'],
    ];

    return $form;
  }

  /**
   * {@inheritdoc}
   */
  public function blockSubmit($form, FormStateInterface $form_state) {
    $this->configuration['show_ship_track'] = $form_state->getValue('show_ship_track');
  }


  /**
   * {@inheritdoc}
   */
  public function build(): array {

    $show_ship_track = $this->configuration['show_ship_track'];
    $nautilus_live_settings = \Drupal::config('nautilus_config.settings');
    $current_expedition_tid = $nautilus_live_settings->get('current_expedition');
    $term = Term::load($current_expedition_tid);
    $current_expedition_name = $term->getName();

    $build['#attached'] = [
      'library' => [
        'nautilus_arcgis_block/ship-location'
      ],
      'drupalSettings' => [
        'showShipTrack' => false,
        'cruiseName' => $current_expedition_name,
      ]
    ];

    if ( $show_ship_track == TRUE ) {
      $build['#attached']['drupalSettings']['showShipTrack'] = true;
    }

    $build['content'] = [
      '#markup' => '<div id="ship-location-map-container" class="arcgis-map"></div>',
    ];
    return $build;
  }

}
