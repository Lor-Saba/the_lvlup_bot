//=require common/utils.js
//=require common/tabs.js

Zepto(function(){
    setLiveTimeoutDate('.item-timeoutduration');

    $('.loader-toggler').on('click', function(){
        toggleLoader(true);
    });
});