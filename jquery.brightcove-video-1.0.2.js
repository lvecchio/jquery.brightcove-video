/**
 * jquery.brightcove-video v1.0.2 (Feb 2013)
 * Helps you create custom dynamic solutions that work with the Brightcove Video platform.
 * Copyright © 2013 Carmine Olivo (carmineolivo@gmail.com)
 * Released under the (http://co.mit-license.org/) MIT license
 *
 * @requires
 * BrightcoveExperiences (http://admin.brightcove.com/js/BrightcoveExperiences.js)
 * jQuery (http://jquery.com/download/)
 *
 * @note On the Global tab of the player settings editor, under Web
 *       Settings, select Enable ActionScript/JavaScript APIs to enable
 *       the player for JavaScripting
 */
(function( $ ) {
"use strict";
var

	/**
	 *
	 */
	brightcoveVideo = {

		/**
		 *
		 */
		init: function( options, createExperiences ) {
			var $that = this;

			if ( typeof brightcove == "undefined" ) {
				$
					.ajax( {
							url: "http://admin.brightcove.com/js/BrightcoveExperiences.js",
							dataType: "script",
							cache: true
						} )
					.done( function(script, textStatus) {
							brightcoveVideo.init.call( $that, options, createExperiences );
						} )
					.fail( function(jqxhr, settings, exception) {
							$.error( "Failed to load BrightcoveExperiences. (http://admin.brightcove.com/js/BrightcoveExperiences.js)" );
						} )
				;
				return this;
			}

			this.each( function() {
				var $container = $( this ),
				    data = $container.data( "brightcoveVideo" ),
				    usrTemplateLoadHandler,
				    usrTemplateReadyHandler,
				    playerObject,
				    params;

				if ( typeof brightcove.pluginData == "undefined" ) {
					brightcove.pluginData = { };
				}
				if ( typeof brightcove.pluginData.onTemplateLoad == "undefined" ) {
					brightcove.pluginData.countPlayers = 0;
					brightcove.pluginData.onTemplateLoad = { };
					brightcove.pluginData.onTemplateReady = { };
				}

				// if the player hasn't been initialized yet
				if ( ! data ) {
				    params = $.extend( {
							experienceID: null,
							playerID: null,
							playerKey: null,
							"@videoPlayer": null,
							height: null,
							width: null,
							wmode: "transparent",
							bgcolor: "#FFFFFF",
							isVid: true,
							isUI: true,
							dynamicStreaming: true,
							secureConnections: null,
							includeAPI: true,
							templateLoadHandler: null,
							templateReadyHandler: null,
							templateErrorHandler: null,
							url: null,
							autoStart: false
				    	}, options );

					brightcove.pluginData.onTemplateLoad[ "player" + brightcove.pluginData.countPlayers ] = function( experienceID ) {
						data.experienceID = experienceID;
						data.player = brightcove.api.getExperience(experienceID);
						if ( data.player ) {
							data.isSmartPlayer = true;
						} else {
							data.player = brightcove.getExperience(experienceID);
							data.isSmartPlayer = false;
						}
						data.videoPlayer = data.player.getModule( brightcove.api.modules.APIModules.VIDEO_PLAYER );
						data.experience = data.player.getModule( brightcove.api.modules.APIModules.EXPERIENCE );

						$container.data( "brightcoveVideo", data );

						if ( usrTemplateLoadHandler != null ) {
							usrTemplateLoadHandler.call( data.container, experienceID );
						}
					};

					brightcove.pluginData.onTemplateReady[ "player" + brightcove.pluginData.countPlayers ] = function( event ) {
						if ( usrTemplateReadyHandler != null ) {
							usrTemplateReadyHandler.call( data.container, event );
						}
					};

					usrTemplateLoadHandler = params.templateLoadHandler;
					usrTemplateReadyHandler = params.templateReadyHandler;
					params.templateLoadHandler = "brightcove.pluginData.onTemplateLoad.player" + brightcove.pluginData.countPlayers;
					params.templateReadyHandler = "brightcove.pluginData.onTemplateReady.player" + brightcove.pluginData.countPlayers;
					params.autoStart = Boolean( params.autoStart );

					playerObject = createPlayerObject( params );

					data = {
						index: brightcove.pluginData.countPlayers++,
						container: this,
						playerObject: playerObject,
						target: $container
					};
					$container.data( "brightcoveVideo", data );

					$container.html( playerObject );
				}
			} );

			if ( createExperiences != false ) {
				brightcoveVideo.createExperiences( );
			}

			return this;
		},

		/**
		 *
		 */
		destroy: function() {

			return this.each( function() {
				var $this = $( this ),
				    data = $this.data( "brightcoveVideo" ),
					playerObject = data.playerObject,
					isSmartPlayer = data.isSmartPlayer,
					experience = data.experience,
				    target = data.target;

				// Namespacing FTW :)
				$( window ).unbind( ".brightcoveVideo" );
				$this.removeData( "brightcoveVideo" );
				isSmartPlayer || experience.unload( );
				playerObject.remove( );
				target.empty( );
			} );

		},

		/**
		 *
		 */
		createExperiences: function( ) {

			brightcove.createExperiences( );

			return this;
		},

		/**
		 * Invokes the callback function with a boolean as to whether the video currently
		 * displayed in the video window is playing. If a linear ad is currently playing,
		 * this returns the state of the ad.
		 *
		 * @param {function} callback The callback function to invoke with the player state.
		 */
		getIsPlaying: function( callback ) {
			return this.each( function() {
				var data = $( this ).data( "brightcoveVideo" );
				if ( data.isSmartPlayer ) {
				   	data.videoPlayer.getIsPlaying( callback )
				} else {
				   	callback.call( this, data.videoPlayer.isPlaying() );
				}
			} );
		},

		/**
		 *
		 */
		getType: function( callback ) {
			return this.each( function() {
				var data = $( this ).data( "brightcoveVideo" );
				callback.call( this, data.player.type );
			} );
		},

		/**
		 * @param {string} event_name BEGIN, CHANGE, COMPLETE, ERROR, PLAY, PROGRESS, SEEK_NOTIFY, STOP
		 */
		onMediaEvent: function( event_name, handler, priority ) {
			return this.each( function() {
				var data = $( this ).data( "brightcoveVideo" ),
				    events = data.isSmartPlayer ? brightcove.api.events.MediaEvent : BCMediaEvent;

				data.videoPlayer
					.addEventListener( events[event_name], handler, priority );
			} );
		},

		/**
		 * @param {string} event_name TEMPLATE_READY
		 */
		onExperienceEvent: function( event_name, handler, priority ) {
			return this.each( function() {
				var data = $( this ).data( "brightcoveVideo" ),
				    events = data.isSmartPlayer ? brightcove.api.events.ExperienceEvent : BCExperienceEvent;

				data.experience
					.addEventListener( events[event_name], handler, priority );
			} );
		},

		/**
		 * @param {string} event_name CUE
		 */
		onCuePointEvent: function( event_name, handler, priority ) {
			return this.each( function() {
				var data = $( this ).data( "brightcoveVideo" ),
				    events = data.isSmartPlayer ? brightcove.api.events.CuePointEvent : BCCuePointEvent;

				data.videoPlayer
					.addEventListener( events[event_name], handler, priority );
			} );
		},

		/**
		 * Returns a transparent HTML element that is positioned directly on top of the video element.
		 */
		overlay: function( html ) {
			var overlays = [ ];

			this.each( function() {
				var $this = $( this ),
				    data = $this.data( "brightcoveVideo" ),
				    $experience, position, $overlay;

				if ( ! data.overlay ) {
					$experience = $( '#' + data.experienceID );
					position = $experience.position( );
					$overlay = $( '<div />' )
						.css({
							position: "absolute",
							top: position.top,
							left: position.left,
							height: $experience.css( "height" ),
							width: $experience.css( "width" ),
							margin: $experience.css( "margin" ),
							padding: $experience.css( "padding" ),
							border: $experience.css( "border" ),
							borderColor: "transparent"
						})
						.html( html )
						.appendTo( $this );

					data.overlay = $overlay.get( )[ 0 ];
				} else if ( html ) {
					$( data.overlay ).html( html );
				}

				overlays.push( data.overlay );
			} );

			return this.pushStack( overlays );
		},

		/**
		 * Pauses or resumes playback of the current video in the video window.
		 *
		 * @param {boolean} pause (Passing a true value will pauses the video playback. Passing false will resume playback.)
		 */
		pause: function( pause ) {
			return this.each( function() {
				$( this ).data( "brightcoveVideo" ).videoPlayer
					.pause( pause );
			} );
		},

		/**
		 *
		 */
		play: function( ) {
			return this.each( function() {
				$( this ).data( "brightcoveVideo" ).videoPlayer
					.play( );
			} );
		},

		/**
		 * Seeks to a specified time position in the video.
		 *
		 * @param {number} time The time in seconds to seek to
		 */
		seek: function( time ) {
			return this.each( function() {
				$( this ).data( "brightcoveVideo" ).videoPlayer
					.seek( time );
			} );
		}
	},

	/**
	 *
	 */
	createPlayerObject = function( params ) {
		var $player = $( '<object />' )
				.attr( "class", "BrightcoveExperience" );

		if ( params.experienceID !== null ) {
			$player.attr( "id", params.experienceID );
		}

		$.each( params, function( n, v ) {
			if ( v !== null ) {
				$( '<param />' ).prop({ name: n, value: v }).appendTo( $player );
			}
		});

		return $player;
	};

	$.fn.brightcoveVideo = function( method ) {
		if ( brightcoveVideo[method] ) {
			return brightcoveVideo[ method ].apply( this, Array.prototype.slice.call(arguments, 1) );
		} else if ( typeof method === "object" || ! method ) {
			return brightcoveVideo.init.apply( this, arguments );
		} else {
			$.error( "Method " + method + " does not exists on jQuery.brightcoveVideo" );
		}
	};

})( jQuery );