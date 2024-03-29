
function setLiveTimeoutDate(selector){

    var timeoutList = [];

    $(selector).each(function(index, el){
        var timeoutEnd = el.getAttribute('data-timeout');
        
        $(el).append(
            '<div class="timeout-h">--</div>:' +
            '<div class="timeout-m">--</div>:' +
            '<div class="timeout-s">--</div>'
        );

        timeoutList.push({
            el: $(el),
            h: $(el).find('.timeout-h'),
            m: $(el).find('.timeout-m'),
            s: $(el).find('.timeout-s'),
            timeLeft: parseInt(timeoutEnd),
            active: true
        });
    });

    var calcTime = function(){
        $.each(timeoutList, function(index, timeoutData){

            if (timeoutData.timeLeft < 0) {
                timeoutData.active = false;
                timeoutData.el.html('Expired');
            }

            if (timeoutData.active == false) return;

            timeoutData.s.text(('00' + parseInt(timeoutData.timeLeft % 60)).slice(-2));
            timeoutData.m.text(('00' + parseInt(timeoutData.timeLeft / 60 % 60)).slice(-2));
            timeoutData.h.text(('00' + parseInt(timeoutData.timeLeft / 60 / 60)).slice(-2));

            timeoutData.timeLeft -= 1;
        });
    };

    calcTime();
    setInterval(calcTime, 1000);
}

function toggleLoader(state) {

    if (state == undefined) {
        state = !$('#loader').hasClass('visible');
    }

    if (state) {
        $('#loader').addClass('visible');
    } else {
        $('#loader').removeClass('visible');
    }
}

function changePage(el){
    var target = el.getAttribute('data-target');

    if (target) {
        $('.tab-page , .tab-button').removeClass('active');
        $(target).addClass('active');
        $(el).addClass('active');
    }
}

function initComponents(){

    var $users = $('.user');
    $('#users-filter-input').on('input', function(){
        var value = this.value.trim().toUpperCase();

        $users.removeClass('hidden');

        if (value) {
            $users
                .filter(function() { 
                    return !this.getAttribute('data-username').includes(value); 
                })
                .addClass('hidden');
        }
    });
}

Zepto(function(){
    initComponents();
    setLiveTimeoutDate('.item-timeoutduration , .monster-timeoutduration');

    $('.loader-toggler').on('click', function(){
        toggleLoader(true);
    });
});