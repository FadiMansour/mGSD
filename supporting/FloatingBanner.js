jQuery(document).ready(function($){
  $(window).scroll(function(){
    if  ($(window).scrollTop() > ($("#toggleSideBar").offset().top - 6)){
      $(".mtoolbar").css("padding-bottom", "2px");
      $(".mtoolbar").css("position", "fixed");
      $(".mtoolbar").css("top", "0");
      $(".mtoolbar").css("border-bottom", "12px solid #CCCCCC");
      $(".mtoolbar").css("width", "100%");
      $(".button").css("border-bottom", "none");
    }
   if  ($(window).scrollTop() <= ($("#toggleSideBar").offset().top - 6)){
      $(".mtoolbar").css("position", "relative");
      $(".mtoolbar").css("top", $("#toggleSideBar").offset);
      $(".mtoolbar").css("border-bottom", "");
      $(".mtoolbar").css("width", "");
      $(".mtoolbar").css("padding", "");
    }
   });
});
