
function changePage(el){
    var target = el.getAttribute('data-target');

    if (target) {
        $('.tab-page , .tab-button').removeClass('active');
        $(target).addClass('active');
        $(el).addClass('active');
    }
}