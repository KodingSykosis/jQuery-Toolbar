(function($) {
    $(function () {
        $('#toolbar').toolbar({
            itemClicked: function (event) {
                var target = $(event.delegateTarget || event.target);
                console.log('Menu Item clicked', target.text(), target);
            }
        });
    });
})(jQuery);