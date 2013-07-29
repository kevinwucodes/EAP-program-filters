/* 
 * filter js prototype
 * author: kwu
 * created: 20130528
 *
 * todo: no language requirement,
 *       filter by GPA range
 * 
 */

String.prototype.toProperCase = function() {
    return this.replace(/\w\S*/g, function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
};




var JSONData = {
  programs: null,
  partners: null,
  programspartners: null,
  programsclasslevels: null,
  packages: null,

  //data points here are used to generate the filter values
  countries: null,
  classlevels: null
};


var JSONServices = {

  getPrograms: function() {
    return $.ajax("http://localhost:8000/programs", {
      dataType: "jsonp",
      success: function( data, textStatus, jqXHR ) {
        console.log(data.length + " programs data received");
        //console.log(data);
        //JSONData.programs = data;


        JSONData.programs = _(data).map(function ( program ) {
          program.GPA = program.GPA.toFixed(2); //format GPA to x.xx significant digits
          return program;
        });
      }
    });
  },

  getPartners: function() {
    return $.ajax("http://localhost:8000/partnerinstitutions", {
      dataType: "jsonp",
      success: function( data, textStatus, jqXHR ) {
        console.log(data.length + " partners data received");
        //console.log(data);
        JSONData.partners = _(data).map(function( partner ) {
          partner.Country = partner.Country.toProperCase();
          return partner;
        });


        JSONData.countries = _(data).chain()
          .map(function( partner ){ return partner.Country; })
          .uniq()
          .sortBy(function( country ) {return country;})
          .value();

        var $countriesContainer = $("ul#countries");
        $countriesContainer.empty();


        _(JSONData.countries).each(function( element, index, list) {
          //console.log('index' + element);
          $countriesContainer.append(
            $("<li>").append(
              $("<label>", {"class":"checkbox"}).append(
                $( "<input>", {
                    type: "checkbox",
                    id: "country-" + index,
                    value: element
                  }).prop("checked", true)
              ).append(
                $("<small>", {text: element})
              )
            )
          );
        });




      }
    });
  },

  getProgramsPartners: function() {
    return $.ajax("http://localhost:8000/programspartnerinstitutions", {
      dataType: "jsonp",
      success: function( data, textStatus, jqXHR ) {
        console.log(data.length + " programspartners data received");
        //console.log(data);
        JSONData.programspartners = data;
      }
    });
  },

  getClasslevels: function() {
    return $.ajax("http://localhost:8000/programsclasslevels", {
      dataType: "jsonp",
      success: function( data, textStatus, jqXHR ) {
        console.log(data.length + " classlevels data received");
        //console.log(data);
        JSONData.programsclasslevels = data;

        JSONData.classlevels = _(data).chain()
          .push({ Classlevel: "Graduate" }) //we need to fake graduates in here as a placeholder
          .map(function( classlevel ){ return classlevel.Classlevel; })
          .uniq()
          .sortBy(function( classlevel ) {
            var rank = {
              "Freshman": 1,
              "Sophomore": 2,
              "Junior": 3,
              "Senior": 4,
              "Graduate": 5
            };
            return rank[classlevel];
          })
          .value();

        var $classlevelsContainer = $("ul#classlevels");
        $classlevelsContainer.empty();

        _(JSONData.classlevels).each(function( element, index, list ) {
          $classlevelsContainer.append(
            $("<li>").append(
              $("<label>", {"class":"checkbox"}).append(
                $( "<input/>", {
                    type: "checkbox",
                    id: "classlevel-" + index,
                    value: element
                  }).prop("checked", true)
              ).append(
                $("<small>", {text: element})
              )
            )
          );
        });

      }   //ajax success
    });
  },

  getPackages: function() {
    return $.ajax("http://localhost:8000/packages", {
      dataType: "jsonp",
      success: function( data, textStatus, jqXHR ) {
        console.log(data.length + " packages data received");
        //console.log(data);
        JSONData.packages = data;
      }
    });
  }

};




var fullPrograms = function() {

  var array = [];

  var partnerObj = function( partnerID ) {
    return _( JSONData.partners )
      .find(function( index ) {
        return index.PartnerInstitutionID === partnerID;
      });
  };

  var programsPartnersArray = _.chain( JSONData.programspartners )
            .reduce(function( memo, val, key ){
              //console.log(memo);              
              //console.log('Partner ' + val.PartnerInstitutionID);
              //console.log('Program ' + val.ProgramID);
              //console.log(key);

              memo[ val.ProgramID ] = (memo[ val.ProgramID ] ? [].concat(memo[ val.ProgramID ],[ val.PartnerInstitutionID ]) : [ val.PartnerInstitutionID ]);
              //console.log(memo)
              return memo;
            }, [])
            .map(function( program ){
              //return (index);
              //console.log(index)
              return _(program).map(function( partnerID ){
                return partnerObj( partnerID );
              });
            })
            .value();


  var classlevels = _( JSONData.programsclasslevels ).chain()
            .reduce(function( memo, val, key ){
              memo[ val.ProgramID ] = (memo[ val.ProgramID ] ? [].concat(memo[ val.ProgramID ],[ {classlevel:val.Classlevel} ]) : [ {classlevel:val.Classlevel} ]);
              return memo;
            }, [])            
            .value();


  //array index based on packageID, to be used by options below
  var seasons = _(JSONData.packages)
              .reduce(function( memo, val, key ){

                var season = {
                  Season: val.Season,
                  SeasonSequence: val.SeasonSequence,
                  TermType: val.TermType,
                  AcademicSeason: val.AcademicSeason
                };

                memo[ val.PackageID ] = _([].concat(memo[ val.PackageID ], season)).compact();
                return memo;
              }, []);
  var options = _(JSONData.packages).chain()
              .reduce(function( memo, val, key ){

                var packageObj =  {
                    PackageID: val.PackageID,
                    Package: val.Package,
                    isDominant: val.isDominant,
                    ComponentSequence: val.ComponentSequence,
                    ComponentName: val.ComponentName,
                    isYear: val.isYear
                };

                memo[ val.ProgramID ] = _([].concat(memo[ val.ProgramID ], packageObj)).chain()
                  .compact()
                  .uniq(function( program ) { return program.PackageID; })
                  .value();
                return memo;
              }, [])
              .map(function( program ){
                return _(program).map(function( pack ){
                  pack.seasons = seasons[pack.PackageID];
                  return pack;
                });
              })
              .value();

  var terms = _(JSONData.packages).chain()
                .reduce(function( memo, val, key ){
                  memo[ val.ProgramID ] = _([].concat(memo[ val.ProgramID ], seasons[ val.PackageID ])).chain()
                    .compact()
                    .value();
                  return memo;
                }, [])
                .map(function( program ) {
                  return _(program).chain()
                    .pluck("Season")
                    .uniq()
                    .map(function ( pack ) {
                      return {Season: pack};
                    })
                    .value();
                })
              .value();
    //return options;
  //};
  //console.log(packages());
  //console.log(seasons);
  //console.log(terms);


  array = _( JSONData.programs ).chain()
          .map(function( program ){

            //partners
            program[ "PartnerInstitutions" ] = programsPartnersArray[ program[ "ProgramID" ] ];

            //if the program classlevel is undefined, we must force an empty array
            program[ "Classlevels" ] = (classlevels[ program[ "ProgramID" ] ] || []);

            //if eligible for gradutes, we add to the classlevels object
            if (program[ "IsEligibleForGraduates" ] === 1) {
              program[ "Classlevels" ].push({ classlevel: "Graduate" });
            }

            //packages
            program [ "Options" ] = options[ program[ "ProgramID" ] ];

            //package for filterjs search only
            program [ "Terms" ] = (terms[ program[ "ProgramID" ] ] || []);

            return program;
          })
          .sortBy(function ( program ){ return program.Name; })
          .value();

  return array;
};  //programsPartnersArray




var filterInit = function( data ){

	var html = $.trim($("#programTemplate").html());
  var template = Handlebars.compile( html );

	var viewBox = function( data ) {
    return template( data );
	};

	var filter_callbacks = {

    after_init: function( result ) {
      $("#output_list").isotope({
        itemSelector: '.program',
        masonry: {
          columnWidth: 110
        }
      });
    },
		after_filter: function( result ) {
			$("#results_count").text("Found " + result.length + " programs");

      //$("#output_list").isotope("reloadItems");
      $("#output_list").isotope({
        itemSelector: '.program',
        masonry: {
          columnWidth: 110
        }
      });

		}
	};

	var settings = {
		filter_criteria: {
      country: ["#countries input:checkbox", "PartnerInstitutions.ARRAY.Country"],
      classlevel: ["#classlevels input:checkbox", "Classlevels.ARRAY.classlevel"],
      terms: ["#terms input:checkbox", "Terms.ARRAY.Season"]
		},
		and_filter_on: true,
		callbacks: filter_callbacks
	};

	return FilterJS( data, "#output_list", viewBox, settings );
};







jQuery(function($) {

  $.when( JSONServices.getPrograms(),
          JSONServices.getPartners(),
          JSONServices.getProgramsPartners(),
          JSONServices.getClasslevels(),
          JSONServices.getPackages()
  ).done(function() {
    //console.log(JSONData.programs);
    //console.log(JSONData.partners);
    //console.log(JSONData.programspartners);


    console.log(fullPrograms());
    //console.log(JSON.stringify(fullPrograms()));


    var a = _(fullPrograms()).find(function( program ){
      return program.ProgramID === 165;
    });
    console.log(a);



    //fullPrograms();


    fjs = filterInit( fullPrograms() );




  });

  $("span#termsToggle a").on("click", function( event ){
    if ($(this).text() === "all") {
      $("ul#terms li input").prop("checked", true);
    } else {
      $("ul#terms li input").prop("checked", false);
    }

    fjs.filter();
  });

  $("span#classlevelsToggle a").on("click", function( event ){
    if ($(this).text() === "all") {
      $("ul#classlevels li input").prop("checked", true);
    } else {
      $("ul#classlevels li input").prop("checked", false);
    }
    fjs.filter();
  });


  $("span#countriesToggle a").on("click", function( event ){
    if ($(this).text() === "all") {
      $("ul#countries li input").prop("checked", true);
    } else {
      $("ul#countries li input").prop("checked", false);
    }
    fjs.filter();
  });




  //fJS = filterInit(JSONServices.data.programs);

  //$('#blahblah_2').prop('checked', true);





});	// $ ready function