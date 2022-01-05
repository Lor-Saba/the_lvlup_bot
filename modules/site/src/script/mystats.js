//=require common/utils.js
//=require common/tabs.js

Zepto(function(){
    setLiveTimeoutDate('.item-timeoutduration , .field-timeoutduration');

    $('.loader-toggler').on('click', function(){
        toggleLoader(true);
    });
});