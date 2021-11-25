

function changePage(el){
    var target = el.getAttribute('data-target');

    if (target) {
        u('.tab-page , .tab-button').removeClass('active');
        u(target).addClass('active');
        u(el).addClass('active');
    }
}