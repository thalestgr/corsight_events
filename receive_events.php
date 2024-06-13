<?php

function debug($value, $name = NULL)
{
  echo '<pre> ' . $name . ' ';
  if (is_array($value)) {
    print_r($value);
  } else {
    var_dump($value);
  }
  echo '</pre>';
}

$data = file_get_contents('php://input');


try {
  $data = json_decode($data, true);

  if (is_array($data)) {
    if (isset($data['event_type'])) {
      if ($data['event_type'] === 'appearance') {

        debug($data);
      }
    }
  }
} catch (\Throwable $th) {
}
