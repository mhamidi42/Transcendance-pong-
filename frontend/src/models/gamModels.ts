const paddleleft = {
	y: 200,
	speed: 5,
};

const paddleright = {
	y : 200,
	speed: 5,
}

const ball = {
	x: 350,
	y: 200,
	vx: 4,
	vy: 3,
	size: 14,
};

const keys: Record<string, boolean> = {
	ArrowUp: false,
	ArrowDown: false,
	w: false,
	s: false,
};

export { keys, paddleleft, paddleright, ball };
