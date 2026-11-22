module.exports = (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Aura AI Vercel Serverless Function running!' });
};
