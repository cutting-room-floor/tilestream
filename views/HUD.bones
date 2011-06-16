// HUD
// ---
// Base view that supports toggling on/off HUD displays.
view = Backbone.View.extend({
    initialize: function(options) {
        _.bindAll(this, 'hud', 'show', 'hide');
    },
    events: _.extend({
        'click .buttons a': 'hud'
    }, Backbone.View.prototype.events),
    hud: function(ev) {
        var link = $(ev.currentTarget);
        var hud = !link.is('.active')
            ? link.attr('href').split('#').pop()
            : false;
        this.hide();
        (hud) && (this.show(hud));
        return false;
    },
    show: function(hud) {
        this.active = hud;
        $('.buttons a[href=#' + hud + ']').addClass('active');
        this.$('.hud.' + hud).addClass('active');
        $('body').addClass('hudActive');
        $('body').addClass('hud'
            + hud.charAt(0).toUpperCase()
            + hud.slice(1)
        );
        return this;
    },
    hide: function() {
        this.$('.buttons .active').removeClass('active');
        this.$('.hud.active').removeClass('active');
        $('body').removeClass('hudActive');
        if (this.active && this.active.length > 0) {
            $('body').removeClass('hud'
                + this.active.charAt(0).toUpperCase()
                + this.active.slice(1)
            );
            this.active = '';
        }
        return this;
    }
});

view.title = 'HUD';
