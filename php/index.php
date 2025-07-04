<?php 

// This file must be under market.topluyo.com/ > App > webhook parameter
$APPLICATION_KEY = "XXXXXXXXXXX x32 length";             // APPLICATION KEY from, market.topluyo.com
$CLIENT_KEY      = "XXXXXXXXXXXXXXXXXXXXXX x64 length";  // CLIENT KEY from topluyo.com > Profile > Settings (Ayarlar) > Devices (Cihazlaar)


function decrypt($encryptedData, $password) {
  $method = 'aes-256-cbc';
  $password = substr(hash('sha256', $password, true), 0, 32);
  $iv = chr(0x0) . chr(0x0) . chr(0x0) . chr(0x0) . chr(0x0) . chr(0x0) . chr(0x0) . chr(0x0) . chr(0x0) . chr(0x0) . chr(0x0) . chr(0x0) . chr(0x0) . chr(0x0) . chr(0x0) . chr(0x0);
  $decrypted = openssl_decrypt(base64_decode($encryptedData), $method, $password, OPENSSL_RAW_DATA, $iv);
  $checksum = substr($decrypted,0,4);
  $message  = substr($decrypted,4);
  if(substr(md5($message),0,4)==$checksum){
    return $message;
  }else{
    return "";
  }  
}



function api($url, $token, $data) {
  $curl = curl_init();
  curl_setopt_array($curl, [
    CURLOPT_URL => $url,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
      "Authorization: Bearer $token",
      "Content-Type: application/json"
    ],
    CURLOPT_POSTFIELDS => json_encode($data)
  ]);

  $response = curl_exec($curl);

  if (curl_errno($curl)) {
    curl_close($curl);
    return ["error" => curl_error($curl)];
  }

  curl_close($curl);
  return json_decode($response, true); // true returns associative array
}



if($_REQUEST["webhook"]){
  $income  = decrypt($_REQUEST["webhook"],$APPLICATION_KEY);
  $webhook = json_decode( $income , true );
  
  $action  = $webhook['action'];
  $data    = $webhook["data"];

  
  if($action=="post/add"){
    $user    = $data['user'];
    $message = $data['message'];
    $channel = $data['channel'];
    $group   = $data['group'];

    if($message=="!selam"){
      $text = "selam " . $user;
      $response = api("https://topluyo.com/!api/post/add/".$group."/".$channel,$CLIENT_KEY,[
        "text" => $text
      ]);
      exit();
    }

    if($message=="!naber"){
      $text = "iyidir " . $user . ' kanka senden naber =)';
      $response = api("https://topluyo.com/!api/post/add/".$group."/".$channel,$CLIENT_KEY,[
        "text" => $text
      ]);
      exit();
    }
  }
}
