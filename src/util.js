

function triangleMesh(n) {
        var h = 1/n,  p = 0;
        var pt = new Float32Array(12*n*n);
        for(var i = 0; i < n; i++ ) {
            for(var j = 0; j < n; j++ ){
                pt[p++] = h*j;  pt[p++] = h*i;
                pt[p++] = h*(j+1);  pt[p++] = h*i;
                pt[p++] = h*j;  pt[p++] = h*(i+1);
                pt[p++] = h*(j+1);  pt[p++] = h*i;
                pt[p++] = h*j;  pt[p++] = h*(i+1);
                pt[p++] = h*(j+1);  pt[p++] = h*(i+1);
            }
        }
        return pt;
    }        
