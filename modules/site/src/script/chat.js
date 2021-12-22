//=require common/utils.js
//=require common/tabs.js

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