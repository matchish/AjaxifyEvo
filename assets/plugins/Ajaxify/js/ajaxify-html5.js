// Ajaxify
// v0.1

(function(window,undefined){
	
	// Prepare our Variables
	var
		History = window.History,
		$ = window.jQuery,
		document = window.document;

	// Check to see if History.js is enabled for our Browser
	if ( !History.enabled ) {
		return false;
	}

	// Wait for Document
	$(function(){
		// Prepare Variables
		var
			/* Application Specific Variables */
			completedEventName = 'statechangecomplete',
			/* Application Generic Variables */
			$window = $(window),
			$body = $(document.body),
			rootUrl = History.getRootUrl(),
			scrollOptions = {
				duration: 800,
				easing:'swing'
			};
		
		// Ensure Content
	
		// Internal Helper
		$.expr[':'].internal = function(obj, index, meta, stack){
			// Prepare
			var
				$this = $(obj),
				url = $this.attr('href')||'',
				isInternalLink;
			
			// Check link
			isInternalLink = url.substring(0,rootUrl.length) === rootUrl || url.indexOf(':') === -1;
			
			// Ignore or Keep
			return isInternalLink;
		};		
	
		// Ajaxify Helper
		$.fn.ajaxify = function(){
			// Prepare
			
			var $this = $(this);
			
			// Ajaxify
			$this.find('a:internal:not(.no-ajaxy)').click(function(event){
				// Prepare
				var
					$this = $(this),
					url = $this.attr('href'),
					title = $this.attr('title')||null;
				
				// Continue as normal for cmd clicks etc
				if ( event.which == 2 || event.metaKey ) { return true; }
				
				// Ajaxify this link
				History.pushState(null,title,url);
				event.preventDefault();
				return false;
			});
			
			// Chain
			return $this;
		};
		
		// Ajaxify our Internal Links
		$body.ajaxify();
		
		// Hook into State Changes
		$window.bind('statechange',function(){
			// Prepare Variables
			var
				State = History.getState(),
				url = State.url,
				relativeUrl = url.replace(rootUrl,'');

			// Set Loading
			$body.addClass('loading');

			// Start Fade Out
			// Animating to opacity to 0 still keeps the element's height intact
			// Which prevents that annoying pop bang issue when loading in new content
			var data = {ajaxify: true};
			$body.find('[data-ajaxify]').each(function(){
				data[$(this).data('ajaxify')] = crc32(encodeURIComponent($(this).html()));	
				if ($(this).hasClass("fade")){
					$(this).animate({opacity:0},800);
				}		
			});
			
			// Ajax Request the Traditional Page
			$.ajax({
				url: url,
				data: data,
				dataType: 'json',
				success: function(data, textStatus, jqXHR){
					// Prepare
					var
						partial;
	
					for (var i = 0; i < data.partials.length; i++) {	
						partial = data.partials[i];					
						$('[data-ajaxify="'+partial.name+'"]').stop(true,true).html(partial.html)
						.ajaxify().css('opacity',100).show();			
					};
					$('[data-ajaxify]').stop(true,true).css('opacity',100).show();

					// Update the title
					document.title = data.title;
					try {
						document.getElementsByTagName('title')[0].innerHTML = document.title.replace('<','&lt;').replace('>','&gt;').replace(' & ',' &amp; ');
					}
					catch ( Exception ) { }
					
					// Complete the change
					if ( $body.ScrollTo||false ) { $body.ScrollTo(scrollOptions); } /* http://balupton.com/projects/jquery-scrollto */
					$body.removeClass('loading');
					$window.trigger(completedEventName);
	
					// Inform Google Analytics of the change
					if ( typeof window._gaq !== 'undefined' ) {
						window._gaq.push(['_trackPageview', relativeUrl]);
					}

					// Inform ReInvigorate of a state change
					if ( typeof window.reinvigorate !== 'undefined' && typeof window.reinvigorate.ajax_track !== 'undefined' ) {
						reinvigorate.ajax_track(url);
						// ^ we use the full url here as that is what reinvigorate supports
					}
				},
				error: function(jqXHR, textStatus, errorThrown){
					document.location.href = url;
					return false;
				}
			}); // end ajax

		}); // end onStateChange

	}); // end onDomLoad

})(window); // end closure
