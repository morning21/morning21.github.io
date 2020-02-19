Bg = {};
Bg.HexToRgba = function (c, e) {
    if (c === "transparent") {
        return c
    }
    if (e != 1) {
        var f = parseInt(((c.indexOf("#") > -1) ? c.substring(1) : c), 16);
        var d = {r: f >> 16, g: (f & 65280) >> 8, b: (f & 255)};
        c = "rgba(" + d.r + "," + d.g + "," + d.b + "," + e + ")"
    }
    return c
};
Bg.audioBgMusic = function () {
};
Bg.audioBgMusic.prototype = {
    init: function () {
        var a = this;
        a.getVal();
        if (!a.open) {
            return null
        }
        if (a.src == null || a.src == "") {
            Bg.ing("音乐不存在!", true, 3000, "notice");
            return null
        }
        a.createAudio();
        return a
    }, getVal: function () {
        var a = $("#pageMusic");
        this.src = a.attr("data-src");
        this.loop = a.attr("data-loop") === "true";
        this.open = a.attr("data-open") === "true";
        this.autoplay = a.attr("data-auto") === "true";
        this.userDefinedIcon = a.attr("data-usericon") === "true";
        this.musicIconColor = a.attr("data-color");
        this.musicIconPath = a.attr("data-iconpath");
    }, createAudio: function () {
        var b = this;
        var a;
        var c = $("#musicIcon");
        if (b.audioEl || b.src.indexOf("_404") > -1) {
            return
        }
        if (window.Audio && (a = new Audio()).canPlayType("audio/mpeg")) {
            b.bindEvent(a, c);
            a.id = "musicplayer";
            a.src = b.src;
            a.loop = b.loop;
            a.autoplay = b.autoplay;

            document.getElementById("pageMusic").appendChild(a);
            b.audioEl = a;
            if (b.userDefinedIcon && b.musicIconPath) {
                c.css({"background-image": "url(" + b.musicIconPath + ")"}).addClass("hasPic")
            } else {
                c.css({"background-color": Bg.HexToRgba(b.musicIconColor, 0.2)});
                c.find("div").css({"background-color": Bg.HexToRgba(b.musicIconColor, 0.5)})
            }
        }
    }, bindEvent: function (b, f) {
        var d = this;
        b.addEventListener("play", e, false);
        b.addEventListener("pause", a, false);
        b.addEventListener("ended", c, false);
        f.bind("click", function () {
            if (b.paused) {
                b.play()
            } else {
                d.autoPaused = false;
                d.autoVedioPaused = false;
                b.pause()
            }
        });

        function e() {
            Bg.isNoPlayMusic = false;
            $(".eleActive .flashing").trigger("startPlayFlash");
            !f.hasClass("musicIconRotate") && f.addClass("musicIconRotate")
        }

        function a() {
            f.removeClass("musicIconRotate")
        }

        function c() {
            if ($("#musicIcon:visible").length == 0) {
                return
            }
            if (!d.loop) {
                f.removeClass("musicIconRotate")
            } else {
                b.play()
            }
        }
    }
};
Bg.audioAutoPlay = function (a) {
    a.play();
};

Bg.bgMusic = new Bg.audioBgMusic().init();