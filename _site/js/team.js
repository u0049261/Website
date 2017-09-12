var getParameterByName = function (name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}
var teamid = decodeURIComponent(getParameterByName("teamid"));
var nextMatchId;

var renderMatchDetails = function(match) {
    var geocoder = new google.maps.Geocoder();
    var address = match.doc.accommodatieDoc.adres;
    var addressStr = address.straat + " " + address.huisNr + ", " + address.plaats;
    geocoder.geocode( { 'address': addressStr}, function(results, status) {
         if (status == google.maps.GeocoderStatus.OK) {
          if (status != google.maps.GeocoderStatus.ZERO_RESULTS) {
            var loc = results[0].geometry.location;

            var infowindow = new google.maps.InfoWindow();
            var map = new google.maps.Map(document.getElementById('mini-map'), {
                zoom: 15,
                center: loc
            });
            var marker = new google.maps.Marker({
                position: loc,
                map: map
            });
            google.maps.event.addListener(marker, 'click', function() {
                infowindow.setContent('<div><strong>' + match.doc.accommodatieDoc.naam + '</strong><br>' + addressStr + '</div>');
                infowindow.open(map, this);
            });
            // 
            // var service = new google.maps.places.PlacesService(map);

            // service.getDetails({ placeId: 'ChIJZRgmzYI7wUcRjEHmCqFIOFA' }, function(place, status) {
            // if (status === google.maps.places.PlacesServiceStatus.OK) {
            //     var marker = new google.maps.Marker({
            //     map: map,
            //     position: place.geometry.location
            //     });
            //     google.maps.event.addListener(marker, 'click', function() {
            //     infowindow.setContent('<div><strong>' + place.name + '</strong><br>' +
            //         place.formatted_address + '</div>');
            //     infowindow.open(map, this);
            //     });
            // }
            // });
          }
         }
    });

   
  }

var renderNextMatch = function(){
  repository.nextMatchOfTeam(teamid, function(match){
        var src;
        var name;
        if(teamid != match.tTGUID){
            src = vbl.teamimage(match.tTGUID);
            name = match.tTNaam;
        }
        if(teamid != match.tUGUID){
            src = vbl.teamimage(match.tUGUID);
            name = match.tUNaam;
        }

        var d = new Date(match.jsDTCode);
        var div = $.template("#next-game-template",
        {
            imgurl: src,
            name: name,
            day: d.toLocaleString(window.navigator.language, {weekday: 'long'}),
            date: d.toLocaleString(window.navigator.language, {day: 'numeric'}) + " " + d.toLocaleString(window.navigator.language, {month: 'long'}),
            time: ('0'+d.getUTCHours()).slice(-2) + ":" + ('0'+d.getMinutes()).slice(-2),
            location: match.accNaam
        });
        $("#next-game-placeholder").append(div);

        nextMatchId = match.guid;
        repository.loadMatchDetails(nextMatchId);
  });

  repository.futureMatches(teamid, function(match){
    var tr = $.template("#future-game-template", {
                date: match.datumString,
                time: match.beginTijd,
                home: match.tTNaam,
                away: match.tUNaam
            }, "tbody");
    $(".future-games").append(tr);
  });

repository.pastMatches(teamid, function(match){
    var tr = $.template("#past-game-template", {
                date: match.datumString,
                time: match.beginTijd,
                home: match.tTNaam,
                away: match.tUNaam,
                result: match.uitslag
            }, "tbody");
    $(".past-games").append(tr);
  });

};

var renderTeam = function(team){
    $("#team-name").text(team.naam);
    var pic = team.naam.replace(/ +/g,".").toLowerCase();
    $("#team-photo").attr("style", "background: url('/img/teams/" + pic +  ".jpg');  background-repeat: no-repeat; background-position: center top; background-size: cover;");
  
    if(team.spelers){
        team.spelers.forEach(function(p){
            var pic = p.naam.replace(/ +/g,".").toLowerCase();
            var div = $.template("#player-template",
            {
                name: p.naam,
                birthDate: p.sGebDat,
                // imgurl: '/img/members/' + pic +  '.jpg'        
                imgscript: "background: url('/img/members/" + pic +  ".jpg'), url('/img/icon.jpg');  background-repeat: no-repeat; background-position: center; background-size: cover;"
            });
            $(".players .tiles").append(div);          
        });
    }
    else{
        var div = $.template("#message-template", {
            message: "Spelers nog niet geregistreerd"
        });
        $(".players .tiles").append(div);
    }

    if(team.tvlijst){
        team.tvlijst.forEach(function(tv){
            var pic = tv.naam.replace(/ +/g,".").toLowerCase();
            var div = $.template("#staff-template",
            {
                name: tv.naam,
                role: tv.tvCaC,
               // imgurl: '/img/members/' + pic +  '.jpg'   
               imgscript: "background: url('/img/members/" + pic +  ".jpg'), url('/img/icon.jpg');  background-repeat: no-repeat; background-position: center; background-size: cover;"       
            });
            $(".staff .tiles").append(div);          
        });
    }
    else{
        var div = $.template("#message-template", {
            message: "Staf nog niet geregistreerd"
        });
        $(".staff .tiles").append(div);
    }

     if(team.poules){
        team.poules.forEach(function(p){
            if(p.naam.indexOf("OEFEN") === -1){
                var entries = [];
                var rank = "-";
                if(p.teams){
                    p.teams.forEach(function(t){
                        if(t.guid == teamid){
                            rank = t.rangNr;
                        }

                        var tr = $.template("#standings-entry-template", {
                            nr: t.rangNr,
                            team: t.naam,
                            played: t.wedAant,
                            wins: t.wedWinst,
                            draws: t.wedGelijk,
                            losses:  t.wedVerloren,
                            points: t.wedPunt
                        }, "tbody")
                        entries.push(tr);
                    });
                }

                var div = $.template("#standings-template",
                {
                    name: p.naam,
                    rank: rank           
                });
                var table = $(div).find(".detail");
                entries.forEach(function(e){
                    table.append(e);
                });
                $(".results").append(div);        
            }  
        });
    }

    $(".detail-toggle").click(function(){
        $(this).parent().nextAll(".detail:first").toggle();  
        return false;
    });
};


$.topic("repository.initialized").subscribe(function () {
  console.log("loading data");
  repository.loadMatches();
  
  repository.loadTeam(teamid);
});

$.topic("vbl.team.loaded").subscribe(function () {
    repository.getTeam(teamid, function(team){
        if(team && team.guid == teamid){
           renderTeam(team);
           $(".loading").hide();
           $("#team-dashboard").css("visibility", "visible");
        }
        if(!team){
            $("#team-name").text("Team niet gevonden");
        }
    });     
});

$.topic("vbl.matches.loaded").subscribe(function () {
     renderNextMatch();   
});

$.topic("vbl.match.details.loaded").subscribe(function (match) {
     repository.getMatchDetails(nextMatchId, function(match){
          renderMatchDetails(match);
     });  
});

$.topic("vbl.members.loaded").subscribe(function () {

});

$( document ).ready(function() {
    
});
