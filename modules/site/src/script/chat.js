
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

function initItemsTimeout(){

    var timeoutList = [];

    $('.item-timeoutduration , .monster-timeoutduration').each(function(index, el){
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
    initComponents();
});