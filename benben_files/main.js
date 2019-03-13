$('#banner').carousel({
    interval: 4000
});
// $('.ewm-a').click(function () {
//     $('.eimg1').toggle()
//     $('.eimg2').toggle()
//     $('.ewm').toggle()
// })

$(function () {
	
	
    dropdownOpen();
    $('#banner').swipe({
        swipeLeft: function () {
            $(this).carousel('next');
        },
        swipeRight: function () {
            $(this).carousel('prev');
        },
    });
	$('.carousel-indicators li').each(function () {
		var i = $(this).index();
		$(this).attr("data-slide-to",i);
	})
})
$(document).off('click.bs.dropdown.data-api');

function dropdownOpen() {

    var $dropdownLi = $('li.xl');

    $dropdownLi.mouseover(function () {
        $(this).children(".dropdown-menu").addClass('show');
    }).mouseout(function () {
        $(this).children(".dropdown-menu").removeClass('show');
    });
}
