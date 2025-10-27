const checkHealth = async () => {
	try {
		return true;
	} catch (error) {
		return false;
	}
};

export default { checkHealth };
