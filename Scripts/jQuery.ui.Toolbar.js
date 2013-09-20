(function ($) {
    //var visible = function() { return $(this).css('visibility') === 'visible'; };

    $.widget('kodingsykosis.toolbar', {
        options: {
            scrollable: true,
            autoHide: false,
            collapsable: true
        },
        
        _create: function () {
            //Remove Text nodes to prevent formatting issues
            this.element
                .contents()
                .not(function () { return this.nodeType !== 3; })
                .remove();

            this.element
                .wrap('<div>');

            this.wrap =
                this.element
                    .parent();
            
            //Clone layout
            this.wrap
                .addClass('ui-toolbar-wrap')
                .css(
                    this.element
                        .css(['margin', 'width'])
                ).css({
                    position: 'relative'
                });
            
            this.element
                .css({
                    margin: '0'
                })
                .addClass('ui-toolbar');

            this.element
                .children()
                .addClass('ui-toolbar-item')
                .children('ul')
                .addClass('ui-toolbar-submenu')
                .children('li')
                .addClass('ui-toolbar-submenu-item')
                .parents('.ui-toolbar-item:first')
                .append('<em class="ui-icon ui-icon-triangle-1-s"></em>')
                .hover($.proxy(this._onSubMenuMouseEnter, this),
                       $.proxy(this._onSubMenuMouseLeave, this));

            this.element
                .find('a')
                .click($.proxy(this._onMenuItemClicked, this));
            
            if (this.options.scrollable) {
                this.initScroll();
            }
            
            if (this.options.collapsable) {
                this.initCollapsable();
            }
        },
        
        initScroll: function () {
            this.scrollHandles = {
                west: $('<div class="ui-toolbar-scroll-west"><em class="ui-icon ui-icon-triangle-1-w"></em></div>'),
                east: $('<div class="ui-toolbar-scroll-east"><em class="ui-icon ui-icon-triangle-1-e"></em></div>')
            };

            this.wrap
                .prepend(this.scrollHandles.west)
                .append(this.scrollHandles.east);

            this.scrollHandles.both =
                this.scrollHandles.west
                    .add(this.scrollHandles.east);

            this.scrollHandles
                .both
                .on({
                    mouseenter: $.proxy(this._onScrollMouseEnter, this),
                    mouseleave: $.proxy(this._onScrollMouseLeave, this)
                });

            this.updScroll();
        },
        
        initCollapsable: function() {
            this.trigger = $('<div class="ui-toolbar-collapse-trigger ui-corner-all"><em class="ui-icon ui-icon-wrench"></em></div>');

            this.trigger
                .append('Tools')
                .click($.proxy(this._onCollapseClicked, this));
            
            this.wrap
                .prepend(this.trigger);
        },

        updScroll: function (projectClipping) {
            if (!this.options.scrollable) return;

            var visible = this.getVisible();
            var elem = this.element;
            var first = elem.children(".ui-toolbar-item:first");
            var last = elem.children('.ui-toolbar-item:last');
            var elemWidth = elem.outerWidth();
            var elemPos = elem.position();
            var maxScroll = -(elem.prop('scrollWidth') - elemWidth);
            var scrollable = Math.abs(maxScroll) > 0;
            var showWest = false, showEast = false;
            
            if (this.options.autoHide) {
                elem.children()
                    .not(visible)
                    .css({
                        visibility: 'hidden'
                    });

                visible.css({
                    visibility: 'visible'
                });

                showWest = !first.is(visible);
                showEast = !last.is(visible);
            } else {
                showWest = scrollable && elemPos.left < 0;
                showEast = scrollable && elemPos.left > maxScroll;
            }
            
            this.scrollHandles
                .west
                .toggle(showWest);

            this.scrollHandles
                .east
                .toggle(showEast);

            //calculate the clip, we need the handles visible
            //so we can get the width
            var handleWidth = this.scrollHandles.both.outerWidth();
            var clip = [0, 0, 1000, 0];
            
            if (projectClipping) {
                handleWidth /= 2;
            }
            
            //east
            clip[1] = (showEast ? elemWidth - handleWidth : elemWidth) - elemPos.left;
            
            //west
            clip[3] = (showWest ? handleWidth : 0) - elemPos.left;
            elem.css({
                clip: 'rect(' + clip.join('px,') + 'px)',
                position: 'absolute'
            });

            this.scrollHandles
                .both
                .children()
                .css({
                    marginTop: (this.wrap.height() / 2) - 8
                });
        },
        
        getVisible: function () {
            var results = $(),
                width =
                    this.element
                        .outerWidth(),
                items = 
                    this.element
                        .children('.ui-toolbar-item');

            for (var i = 0, len = items.length; i < len; i++) {
                var item = $(items[i]);
                var pos = item.position();
                var w = item.outerWidth() + pos.left;

                if (0 <= pos.left && w <= width) {
                    results = results.add(item);
                }
            }

            return results;
        },
        
        expand: function() {
            this.toggle(true);
        },
        
        collapse: function() {
            this.toggle(false);
        },

        toggle: function(show) {
            var elem = this.element;
            if (!elem.data('orgWidth') && !show) {
                elem.data('orgWidth', elem.outerWidth());
            }

            var targetWidth = show ? elem.data('orgWidth') : 0;
            var self = this;
            var wrap = this.wrap;
            var queueName = this.widgetName;

            elem.stop(queueName, true);

            if (this.options.scrollable && !show) {
                this.scrollHandles
                    .both
                    .fadeOut(100);
            }

            if (!show) {
                wrap.height(elem.height());
                elem.addClass('ui-collapsing');
            } else {
                elem.css('width', '0')
                    .show();
            }
            
            elem.animate({
                    width: targetWidth
                }, {
                    queue: queueName,
                    duration: 500,
                    complete: function () {
                        if (show) {
                            elem.removeClass('ui-collapsed');
                            self.updScroll();
                        } else {
                            elem.hide()
                                .removeClass('ui-collapsing')
                                .addClass('ui-collapsed');
                        }
                    }
                });

            elem.dequeue(queueName);
        },

        _isVisible: function(elem) {
            var elemPos = elem.position();
            var parPos = this.element.position();
            return 0 <= parPos.left + elemPos.left;
        },

        _onScrollMouseEnter: function (event) {
            var target = $(event.delegateTarget || event.target);
            var elem = this.element;
            var width = elem.width();
            var scrollPos = target.is(this.scrollHandles.west)
                    ? 0
                    : -(elem.prop('scrollWidth') - width);

            this.element
                .animate({
                    left: scrollPos
                }, {
                    duration: 600,
                    step: $.proxy(this.updScroll, this),
                    complete: $.proxy(this.updScroll, this)
                });
        },
        
        _onScrollMouseLeave: function() {
            this.element
                .stop(true, false);
        },
        
        _onCollapseClicked: function() {
            var elem = this.element;
            var collapse = elem.is('.ui-collapsing,.ui-collapsed');
            this.toggle(collapse);
        },
        
        _onSubMenuMouseEnter: function (event) {
            var target = $(event.delegateTarget || event.target);
            if (!this._isVisible(target)) return;

            var elem = target.children('.ui-toolbar-submenu');
            elem.stop()
                .slideDown(100);
        },
        
        _onSubMenuMouseLeave: function (event) {
            var target = $(event.delegateTarget || event.target);
            var elem = target.children('.ui-toolbar-submenu');
            elem.stop()
                .slideUp(100);
        },
        
        _onMenuItemClicked: function(event) {
            this._trigger('itemClicked', event);
        }
    });
})(jQuery);