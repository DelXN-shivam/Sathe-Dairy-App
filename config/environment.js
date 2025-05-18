const ENV = {
  dev: {
    // API_URL: 'https://sathe-dairy-backend-d2qh.vercel.app',
    API_URL: 'https://sathe-dairy-backend-6cks.vercel.app/',
 

  }, 
  prod: {
    API_URL: 'https://sathe-dairy-backend-6cks.vercel.app/',
  },
  
  
};
export default () => (process.env.NODE_ENV === 'development' ? ENV.dev : ENV.prod);
