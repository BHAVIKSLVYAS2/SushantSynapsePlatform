const {fail}=require('../../../server/http');
function cleanSettings(input) {
  const result = { timezone: 'Asia/Kolkata' };
  for (const key of ['name','advocate','email','phone','address','barNumber']) {
    const value = input[key] ?? '';
    if (typeof value !== 'string' || value.length > 2000) fail(400, `Invalid ${key}`);
    result[key] = value.trim();
  }
  if (!result.name) fail(400, 'Chambers name is required');
  return result;
}

module.exports={cleanSettings};
