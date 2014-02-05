var _multiline = function(f) {
  return f.toString().split('\n').slice(1, -1).join('\n');
}


template = _multiline(function() {/**   

	varying float vDisplacement;
	varying vec4 vPosition;
	
	uniform  float sealevel;

	const vec4 NONE = vec4(0.0,0.0,0.0,0.0);
	const vec4 OCEAN = vec4(0.04,0.04,0.2,1.0);
	const vec4 SHALLOW = vec4(0.04,0.58,0.54,1.0);

	const vec4 MAFIC  = vec4(50,45,50,255)/255.			// observed on lunar maria 
	                  * vec4(1,1,1,1);					// aesthetic correction 
	const vec4 FELSIC = vec4(190,180,185,255)/255.		// observed on lunar highlands
					  * vec4(0.6 * vec3(1,1,.66), 1);	// aesthetic correction;
	//const vec4 SAND = vec4(255,230,155,255)/255.;
	const vec4 SAND = vec4(245,215,145,255)/255.;
	const vec4 PEAT = vec4(100,85,60,255)/255.;
	const vec4 SNOW  = vec4(0.9, 0.9, 0.9, 0.9); 
	const vec4 JUNGLE = vec4(30,50,10,255)/255.;
	//const vec4 JUNGLE = vec4(20,45,5,255)/255.;

	void main() {
		float epipelagic = sealevel - 200.0;
		float abyssopelagic = sealevel - 4000.0;
		float maxheight = sealevel + 15000.0; 

		float felsic_fraction = smoothstep(abyssopelagic, maxheight, vDisplacement);
		vec4 bedrock			= mix(MAFIC, FELSIC, felsic_fraction);

		if (vDisplacement < epipelagic) {
			gl_FragColor = OCEAN;
		} else if (vDisplacement < sealevel) {
			float x = smoothstep(epipelagic, sealevel, vDisplacement);
			gl_FragColor =  mix(OCEAN, SHALLOW, x);
		} else {

			float mineral_fraction = smoothstep(maxheight, sealevel, vDisplacement);

			float lat = degrees(asin(abs(vPosition.y)));
			float lapse_rate = 6.4 / 1000.; // oC per m
			
			//Mean annual temperature, oC
			float temp = mix(30., -25., abs(vPosition.y)) - lapse_rate * (vDisplacement - sealevel);
			
			//Mean annual precipitation, mm yr-1
			float precip = 4500.;
			precip = mix(precip, 	0., 	smoothstep(0.,  30., 	lat)); 	//hadley cell
			precip = mix(precip, 	2250.,	smoothstep(30., 60., 	lat)); 	//ferrel cell
			precip = mix(precip, 	0., 	smoothstep(60., 90., 	lat)); 	//polar cell

			//Net Primary Productivity (NPP), expressed as the fraction of an modeled maximum (3 kg m-2 yr-1)
			//Derived using the Miami model (Lieth et al. 1972). A summary is provided by Grieser et al. 2006
			float npp_temp 		= (1. + exp(1.315 - 0.119 * temp)); //temperature limited npp
			float npp_precip 	= (1. - exp(-0.000664 * precip)); 	//drought limited npp
			float npp = min(npp_temp, npp_precip); 					//realized npp, the most conservative of the two estimates
			
			float organic_fraction 	= lat/90.; // smoothstep(30., -30., temp); // 

			vec4 soil				= mix(bedrock, mix(SAND, PEAT, organic_fraction), mineral_fraction);
			vec4 canopy 			= mix(soil, JUNGLE, npp);
			vec4 snow 				= mix(canopy, SNOW, smoothstep(80., 85., lat));
			
			gl_FragColor = @OUTPUT;
		}
	}

**/});

fragmentShaders = {}

fragmentShaders.satellite = template.replace('@OUTPUT', 'snow');
fragmentShaders.soil 	= template.replace('@OUTPUT', 'soil');
fragmentShaders.bedrock	= template.replace('@OUTPUT', 'bedrock');
fragmentShaders.npp 	= template.replace('@OUTPUT', 'mix(vec4(1), vec4(0,1,0,1), npp)');
fragmentShaders.temp 	= template.replace('@OUTPUT', 'mix(vec4(1,0,0,1), vec4(0,0,1,1), smoothstep(30., -25., temp))');
fragmentShaders.precip 	= template.replace('@OUTPUT', 'mix(vec4(1), vec4(0,0,1,1), smoothstep(0., 4500., precip))');

fragmentShaders.debug = _multiline(function() {/**   

	varying float vDisplacement;
	varying vec4 vPosition;
	
	uniform  float sealevel;
	uniform  vec3 color;
	
	const vec4 BOTTOM = vec4(0.0,0.0,0.0,1.0);//rgba
	const vec4 TOP = vec4(1.0,1.0,1.0,1.0);

	void main() {
		float mountainMinHeight = sealevel + 5000.;
		float mountainMaxHeight = sealevel + 15000.0;
		if(vDisplacement > sealevel){
			float x = smoothstep(mountainMinHeight, mountainMaxHeight, vDisplacement);
			gl_FragColor =  mix(vec4(color, 1.0), TOP, x);
		} else if (vDisplacement > 1.){
			float x = smoothstep(-sealevel, sealevel, vDisplacement);
			gl_FragColor =  mix(BOTTOM, vec4(color*.75, 1.0), x);
		} else {
			gl_FragColor =  vec4(0,0,0,1);
		}
	}

**/});