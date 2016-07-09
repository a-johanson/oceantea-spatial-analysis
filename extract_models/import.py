from netCDF4 import Dataset
import numpy as np
import math
import json

grd = Dataset("edit_12m.grd", "r")
print(grd.data_model)
print(grd.dimensions)
print(grd.variables)

xgrd = grd.variables["x"]
ygrd = grd.variables["y"]
zgrd = grd.variables["z"] # zgrd(y,x)

x = np.copy(xgrd) # lon
y = np.copy(ygrd) # lat
zT = np.copy(zgrd)
z = zT.transpose() # z(x,y) = depth(lon, lat)
print("x.shape:", x.shape)
print("y.shape:", y.shape)
print("z.shape:", z.shape)

def invalidZ(v):
	return math.isnan(v)

n_x = x.size
n_y = y.size
skip = 2

# https://en.wikipedia.org/wiki/Latitude#Length_of_a_degree_of_latitude
phi = np.median(y) * math.pi / 180.0
degLatInMeters = 111132.954 - 559.822 * math.cos(2.0*phi) + 1.175 * math.cos(4.0*phi)
print("degLatInMeters:", degLatInMeters)
phi = np.median(x) * math.pi / 180.0
degLonInMeters = 10.0 * math.pi * 6378137.0 * math.cos(phi) / (180.0 * math.sqrt(1.0 - 0.00669437999014 * math.sin(phi) * math.sin(phi)))
print("degLonInMeters:", degLonInMeters)


vertices = []
global2Local = np.full(z.shape, -1, dtype=int)

for i in range(0, n_x, skip):
	for j in range(0, n_y, skip):
		z_ij = z[i,j]
		if invalidZ(z_ij):
			continue
		vertices.append((i, j, float(z_ij)))
		global2Local[i,j] = len(vertices) - 1


faces = []

for i in range(0, n_x-skip, skip):
	for j in range(0, n_y-skip, skip):
		a = (i, j)
		b = (i+skip, j)
		c = (i+skip, j+skip)
		d = (i, j+skip)

		b_nan = invalidZ(z[b])
		c_nan = invalidZ(z[c])
		a_nan = invalidZ(z[a])
		d_nan = invalidZ(z[d])

		if (not a_nan) and (not d_nan) and (not b_nan):
			faces.append((int(global2Local[a]), int(global2Local[b]), int(global2Local[d])))
		
		if (not d_nan) and (not c_nan) and (not b_nan):
			faces.append((int(global2Local[d]), int(global2Local[b]), int(global2Local[c])))


model = {
	"lon_min": x[0],
	"lon_max": x[x.size-1],
	"lon": x.tolist(),
	"lat_min": y[0],
	"lat_max": y[y.size-1],
	"lat": y.tolist(),
	"degLatInMeters": degLatInMeters,
	"degLonInMeters": degLonInMeters,
	"depth_min": float(np.nanmin(z)),
	"depth_max": float(np.nanmax(z)),
	"vertices": vertices, # [lon_id,lat_id,depth]
	"faces": faces
}


with open("stjernsund.json", "w", encoding="utf-8") as f:
	json.dump(model, f)


grd.close()
