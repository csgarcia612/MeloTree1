module.exports = {
	getUser: (req, res) => {
		// console.log(req);
		res.json({ user: req.session.user });
	}
};
