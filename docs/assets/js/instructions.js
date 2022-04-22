function evalComponents(d, prefix){
    if(d === undefined || d.length == 0)
        return;
    
    var groups = false;
    var parts = new Array();

    var s = '';
    
    
    var i = 0;
    d.forEach(function(it){
        var p = prefix + i + '_';
        if(it.components !== undefined){
            if(groups == false){
                groups = true;
                s += '<div class="accordion" id="a_' + prefix + '">';
            }
            s += '<div class="accordion-item">';
                s += '<h2 class="accordion-header" id="h_' + p + '">';
                    s += '<button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#c_' + p + '" aria-expanded="false" aria-controls="c_' + p + '"';
                    if(typeof it.model !== 'undefined')
                        s += 'onclick="loadGLB(this,' + String.fromCharCode(0x27) + it.model + String.fromCharCode(0x27) + ');"';
                    s += '>';
                    s += it.num + 'x ' + it.name;
                    s += '<span class="badge bg-light text-dark ms-auto">';
                    s += countParts(it) + " Parts";
                    s += '</span>';
                    s += '</button>';
                    
                s += '</h2>';
                
            s += '<div id="c_' + p + '" class="accordion-collapse collapse" aria-labelledby="h_' + p + '" data-bs-parent="#a_' + prefix + '">';
                s += '<div class="accordion-body">';
                s += evalComponents(it.components, p);

                if(typeof it.manual !== 'undefined'){
                    s += '<br/><div class="accordion"><div class="accordion-item">';
                    s += '<h2 class="accordion-header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#as_' + p + '" aria-expanded="false" aria-controls="as_' + p + '"><b>Assembly Steps:</b></button></h2>';
                    s += '<div id="as_' + p + '" class="accordion-body collapse">';
                            s += '<ol>';
                            it.manual.forEach(function(m){
                                s += '<li>' + m + '</li>';
                            });
                    s += '</ol></div></div></div>';
                }
            s += '</div></div></div>';
        } else if (it.desc !== undefined) {                       
            parts.push(it);
        }


        i++;
    });

    if(groups && parts.length > 0){
        s += '<div class="accordion-item">';
            s += '<h2 class="accordion-header" id="ho_' + prefix + '">';
                s += '<button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#co_' + prefix + '" aria-expanded="false" aria-controls="co_' + prefix + '">';
                    s += 'Others'
                    s += '<span class="badge bg-light text-dark ms-auto">';
                    s += countParts(parts) + " Parts";
                    s += '</span>';
                s += '</button>';
            s += '</h2>';
        s += '<div id="co_' + prefix + '" class="accordion-collapse collapse p-1" aria-labelledby="ho_' + prefix + '" data-bs-parent="#a_' + prefix + '">';
    }

    if(parts.length > 0){
        s += '<div class="row row-cols-1 row-cols-md-2 g-1">';
    }

    parts.forEach(function(it){
        s += '<div class="col">';
            s += '<div class="card h-100">';
                if(typeof it.img !== 'undefined')
                    s += '<img src="./assets/img/' + it.img + '" class="card-img-top">';
                s += '<div class="card-body">';
                    s += '<h5 class="card-title">' + it.num + 'x ' + it.name + '</h5>';
                    s += '<p class="card-text">' + it.desc + '</p>';
                s += '</div>';
                if(typeof it.files !== 'undefined'){
                    s += '<div class="card-body d-grid">';
                        s += '<a class="btn btn-primary" type="button" href="https://github.com/imldresden/STRAIDE/tree/master/Hardware/' + it.files + '" target="_blank"><i class="bi bi-cloud-arrow-down-fill"></i> Download</a>';
                    s += '</div>';
                } else if(typeof it.file !== 'undefined'){
                    s += '<div class="card-body d-grid">';
                        s += '<a class="btn btn-primary" type="button" href="https://github.com/imldresden/STRAIDE/tree/master/Hardware/' + it.file + '" download><i class="bi bi-cloud-arrow-down-fill"></i> Download ' + it.file.slice(it.file.indexOf(".")+1).toUpperCase() + '</a>';
                    s += '</div>';
                }

            s += '</div>';
        s += '</div>';
    });

    if(parts.length > 0){
        s += '</div>';
    }

    if(groups && parts.length > 0){
        s += '</div></div>';
    }

    if(groups){
        s += '</div>';
    }


    return s;
}

function countParts(d){
    if(Array.isArray(d)){           // array for "OTHER" parts group
        var n = 0;
        d.forEach(function(it){
            n += it.num;
        });
        return n;                    
    } else if(typeof d.components === 'undefined'){         // single component
        return d.num;
    } else {
        var n = 0;
        d.components.forEach(function(it){          // group of components
            n += d.num * countParts(it);
        });
        return n;
    }
    return 12345;
}

function composeIndividual(d, firstIndex){
    let s = "";
    let count = 0;
    

    if(Array.isArray(d.components)){
        s += `<span class="manualLabel">${d.name}</span>`;
        d.components.forEach(function(it){
            let ret = composeIndividual(it, firstIndex + count);
            s += ret[0];
            count += ret[1];
        });
    }

    if(Array.isArray(d.manual)){
        d.manual.forEach(function(it){
            s += `<li value=${firstIndex + count}>${it}</li>`;
            count++;
        })
    }

    if(d.num > 1 && count > 0){
        s += "<li value=" + (firstIndex + count) + ">Repeat step " + (firstIndex) + "-" + (firstIndex + count - 1) + ": " + (d.num - 1) + " more times.</li>";
        count++;
    }

    if(count > 0){
        s =  `<div class="card"><ol>` + s;
        s += "</ol></div>";
    }

    

    return [s,count];
}

function composeManual(d){
    return composeIndividual(d,1)[0];
}

function loadGLB(el,model){

    if(!$(el).hasClass("collapsed") && typeof model !== 'undefined'){
        $("#3dpreview").attr("src", "./assets/models/" + model);
    }
    //console.log(document.getElementById("3dpreview"));
}