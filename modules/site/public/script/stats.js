
function changePage(el){
    var target = el.getAttribute('data-target');

    if (target) {
        $('.tab-page , .tab-button').removeClass('active');
        $(target).addClass('active');
        $(el).addClass('active');
    }
}

function initItemsTimeout(){

    var timeoutList = [];

    $('.item-timeoutduration').each(function(index, el){
        var timeoutEnd = el.getAttribute('data-timeout');
        
        timeoutList.push({
            el: $(el),
            h: $(el).find('.item-timeoutduration-h'),
            m: $(el).find('.item-timeoutduration-m'),
            s: $(el).find('.item-timeoutduration-s'),
            timeLeft: parseInt(timeoutEnd),
            active: true
        });
    });

    setInterval(function(){
        $.each(timeoutList, function(index, timeoutData){

            if (timeoutData.timeLeft < 0) {
                timeoutData.active = false;
                timeoutData.el.html('');
            }

            if (timeoutData.active == false) return;

            timeoutData.s.text(('00' + parseInt(timeoutData.timeLeft % 60)).slice(-2));
            timeoutData.m.text(('00' + parseInt(timeoutData.timeLeft / 60 % 60)).slice(-2));
            timeoutData.h.text(('00' + parseInt(timeoutData.timeLeft / 60 / 60)).slice(-2));

            timeoutData.timeLeft -= 1;
        });
    }, 1000);
}

Zepto(function(){
    initItemsTimeout();
});