//handlebars helpers
Handlebars.registerHelper('gpaH', function( options ){
  var text = '<p class="label ';
  text += ((this.GPA >=2 && this.GPA < 3) ? 'label-blue' : 'label-green');
  text += '">' + options.fn(this) + "</p>";
  return text;
});
Handlebars.registerHelper('termsH', function(){
  var termsColor;
  switch (this.Season) {
    case "Fall":
      termsColor = "blue";
    break;
    case "Winter":
      termsColor = "green";
    break;
    case "Spring":
      termsColor = "orange";
    break;
    default:
      termsColor = "red";
    break;
  }
  var text = '<p class="label ';
  text += "label-" + termsColor;
  text += '">' + this.Season + "</p>";
  return text;
});
Handlebars.registerHelper('classlevelH', function(options){
  return '<p class="label">' + this.classlevel + '</p>';
});