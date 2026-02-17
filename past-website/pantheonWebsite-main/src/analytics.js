import ReactGA from 'react-ga4';

const MEASUREMENT_ID = process.env.REACT_APP_GA_MEASUREMENT_ID;

export const initGA = () => {
  if (MEASUREMENT_ID) {
    ReactGA.initialize(MEASUREMENT_ID);
  }
};

export const trackPageView = (path) => {
  if (MEASUREMENT_ID) {
    ReactGA.send({ hitType: 'pageview', page: path });
  }
};
