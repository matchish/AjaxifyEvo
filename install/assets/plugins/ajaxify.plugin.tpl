//<?php
/**
 * Ajaxify
 *
 * one page site functionality  
 * 
 * @category    plugin
 * @version     0.1
 * @author      Husband
 * @internal    @properties &templates=ID шаблонов на которых рабатывает плагин;text;7 &jquery=jQuery;text;0
 * @internal    @events OnLoadWebDocument,OnWebPagePrerender
 * @internal    @installset base
 */

if (!defined('MODX_BASE_PATH')) {
	die('What are you doing? Get out of here!');
}
$e =& $modx->event;

switch ($e->name) {
	case 'OnLoadWebDocument':
		
		if (!empty($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) == 'xmlhttprequest') {
			$modx->contentTypes[$modx->documentIdentifier] = 'application/json';
		}
		
		$current_template = $modx->documentObject['template'];
		$templates        = explode(',', $templates);
		if (!in_array($current_template, $templates)) {
			return '';
		}
		
		if ($jquery) {
			$jquery = 'assets/plugins/Ajaxify/js/jquery.min.js';
			$modx->regClientStartupScript($jquery, array(
				'name' => 'jquery',
				'version' => '1.9.1'
			));
		}
		
		$scrollto = 'assets/plugins/Ajaxify/js/jquery-scrollto.js';
		$modx->regClientScript($scrollto, array(
			'name' => 'jquery-scrollto'
		));
		
		$history = 'assets/plugins/Ajaxify/js/jquery.history.js';
		$modx->regClientScript($history, array(
			'name' => 'jquery.history'
		));
		
		$ajaxify_evo = 'assets/plugins/Ajaxify/js/ajaxify-html5.js';
		$modx->regClientScript($ajaxify_evo, array(
			'name' => 'ajaxify_evo',
			'version' => '0.1'
		));
		
		$crc32 = 'assets/plugins/Ajaxify/js/crc32.js';
		$modx->regClientScript($crc32, array(
			'name' => 'crc32.jquery'
		));
		
		break;
		
	case 'OnWebPagePrerender':
		if (!empty($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) == 'xmlhttprequest') {
			
			if (!function_exists(encodeURIComponent)) {
				function encodeURIComponent($str)
				{
					$str    = str_replace("\r\n", "\n", $str);
					$revert = array(
						'%2A' => '*',
						'%27' => "'",
						'%28' => '(',
						'%29' => ')',
						'%C2%A0' => '%26nbsp%3B'
					);
					return strtr(rawurlencode($str), $revert);
				}
			}
			
			$dom_document = new DOMDocument('1.0', 'UTF-8');
			libxml_use_internal_errors(true);
			$dom_document->loadHTML(mb_convert_encoding($modx->documentOutput, 'html-entities', 'utf-8'));
			$title = $dom_document->getElementsByTagName("title");
			if ($title->length > 0) {
				$title = $title->item(0)->nodeValue;
			}
			
			$dom_xpath = new DOMXpath($dom_document);
			$elements  = $dom_xpath->query("//*[@data-ajaxify]");
			$partials  = array();
			
			if (!is_null($elements)) {
				
				foreach ($elements as $element) {
					$html        = '';
					$partialName = $element->getAttributeNode('data-ajaxify')->nodeValue;

					$dom_partial = new DOMDocument('1.0', 'UTF-8');

					foreach ($element->childNodes as $node) {
						$node = $dom_partial->importNode($node, true);
						$dom_partial->appendChild($node);
					}

					$html = $dom_partial->saveHTML();

					if ($_REQUEST[$partialName] != crc32(encodeURIComponent($html))) {
						$partials[] = array(
							'name' => $partialName,
							'html' => $html
						);
					}
				}
				
			}
			libxml_use_internal_errors(false);
			$data                 = array(
				'title' => $title,
				'partials' => $partials
			);
			$modx->documentOutput = json_encode($data);
		}
		break;
}