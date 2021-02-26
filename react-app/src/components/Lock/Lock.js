import {
  Button,
  Container,
  Grid,
  Header,
  Icon,
  Image,
  Message,
  Segment,
} from "semantic-ui-react";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import Arrow from "../Arrow/Arrow";

export default function Lock({ joeColor, revealJoe, user }) {
  const [bearing, setBearing] = useState(null);
  const [compassReadingCount, setCompassReadingCount] = useState(0);
  const [geolocation, setGeolocation] = useState(null);
  const [KMDistance, setKMDistance] = useState(null);
  const [linkedCompassDirection, setLinkedCompassDirection] = useState(null);
  const [locked, setLocked] = useState(false);
  const { lockId } = useParams();
  const [midwayGPS, setMidwayGPS] = useState({
    midwayGPSLatitude: null,
    midwayGPSLongitude: null,
    midwayPointCity: null,
  });
  const [myCompassDirection, setMyCompassDirection] = useState(null);
  const [myWeather, setMyWeather] = useState(null);
  const [partnerIsLocked, setPartnerIsLocked] = useState(false);
  const [runningCompass, setRunningCompass] = useState(false);
  const [themeColor, setThemeColor] = useState("purple");
  const [toggleButton, setToggleButton] = useState(true);
  const [viewHeight, setViewHeight] = useState("74.5vh");
  const [yourWeather, setYourWeather] = useState(null);

  const calculateBearing = () => {
    let myLat;
    let myLong;
    let theirLat;
    let theirLong;

    // why did I have to flip this direction?
    if (user["initiatorOrJoiner"] === "initiator") {
      myLat = geolocation.initiatorGPSLatitude;
      myLong = geolocation.initiatorGPSLongitude;
      theirLat = geolocation.joinerGPSLatitude;
      theirLong = geolocation.joinerGPSLongitude;
    } else {
      myLat = geolocation.joinerGPSLatitude;
      myLong = geolocation.joinerGPSLongitude;
      theirLat = geolocation.initiatorGPSLatitude;
      theirLong = geolocation.initiatorGPSLongitude;
    }

    // do we lose any precision here?
    // and what level of precision do we need, to 4 places?
    myLat = parseFloat(myLat);
    myLong = parseFloat(myLong);
    theirLat = parseFloat(theirLat);
    theirLong = parseFloat(theirLong);

    const myLatRad = myLat * (Math.PI / 180);
    const myLongRad = myLong * (Math.PI / 180);
    const theirLatRad = theirLat * (Math.PI / 180);
    const theirLongRad = theirLong * (Math.PI / 180);

    const R = 6371e3;
    const φ1 = (myLat * Math.PI) / 180;
    const φ2 = (theirLat * Math.PI) / 180;
    const Δφ = ((theirLat - myLat) * Math.PI) / 180;
    const Δλ = ((theirLong - myLong) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceInMeters = R * c;

    setKMDistance(distanceInMeters / 1000);

    const y = Math.sin(theirLongRad - myLongRad) * Math.cos(theirLatRad);
    const x =
      Math.cos(myLatRad) * Math.sin(theirLatRad) -
      Math.sin(myLatRad) *
        Math.cos(theirLatRad) *
        Math.cos(theirLongRad - myLongRad);
    const theta = Math.atan2(y, x);
    const bearing = ((theta * 180) / Math.PI + 360) % 360;

    setBearing(bearing); // a little off, but close

    // midpoint calculation
    const Bx = Math.cos(theirLatRad) * Math.cos(theirLongRad - myLongRad);
    const By = Math.cos(theirLatRad) * Math.sin(theirLongRad - myLongRad);
    const midwayLatRad = Math.atan2(
      Math.sin(myLatRad) + Math.sin(theirLatRad),
      Math.sqrt((Math.cos(myLatRad) + Bx) ** 2 + By ** 2)
    );
    const midwayLongRad = myLongRad + Math.atan2(By, Math.cos(myLatRad) + Bx);

    let midwayLatitude = midwayLatRad * (180 / Math.PI);
    midwayLatitude = ((midwayLatitude + 270) % 180) - 90;
    let midwayLongitude = midwayLongRad * (180 / Math.PI);
    midwayLongitude = ((midwayLongitude + 540) % 360) - 180;

    const radius = 100;

    midwayData(midwayLatitude, midwayLongitude, radius);

    localeData();

    return bearing;
  };

  const checkIfLocked = () => {
    if (parseInt(bearing) === parseInt(myCompassDirection)) {
      setLocked(true);
    } else {
      setLocked(false);
    }
  };

  const detectIfMobileBrowser = () => {
    const toMatch = [
      /Android/i,
      /webOS/i,
      /iPhone/i,
      /iPad/i,
      /iPod/i,
      /BlackBerry/i,
      /Windows Phone/i,
    ];

    return toMatch.some((element) => {
      return navigator.userAgent.match(element);
    });
  };

  const endLock = () => {
    setToggleButton(true);
    setBearing(null);
    setRunningCompass(false);
  };

  const getGeolocationData = () => {
    fetch(`/api/lock/${lockId}/get-geolocation`, {
      method: "get",
      headers: {
        "Content-Type": "application/json",
      },
    }).then((response) => {
      response.json().then((data) => {
        setGeolocation(data);
      });
    });
  };

  const inner = (event) => {
    if (event.webkitCompassHeading) {
      setMyCompassDirection(event.webkitCompassHeading);
    } else {
      setMyCompassDirection(null);
    }
  };

  const localeData = () => {
    let myLat;
    let myLong;
    let yourLat;
    let yourLong;

    if (user["initiatorOrJoiner"] === "initiator") {
      myLat = geolocation.initiatorGPSLatitude;
      myLong = geolocation.initiatorGPSLongitude;
      yourLat = geolocation.joinerGPSLatitude;
      yourLong = geolocation.joinerGPSLongitude;
    } else {
      myLat = geolocation.joinerGPSLatitude;
      myLong = geolocation.joinerGPSLongitude;
      yourLat = geolocation.initiatorGPSLatitude;
      yourLong = geolocation.initiatorGPSLongitude;
    }

    fetch(`/api/locale/${user.id}/${myLat}/${myLong}`, {
      method: "GET",
    }).then((result) => {
      result.json().then((data) => {
        setMyWeather({
          temperatureFeelsLikeFahrenheit: data.temperatureFeelsLikeFahrenheit,
          weatherDescription: data.weatherDescription,
        });
      });
    });

    fetch(`/api/locale/${user.id}/${yourLat}/${yourLong}`, {
      method: "GET",
    }).then((result) => {
      result.json().then((data) => {
        setYourWeather({
          temperatureFeelsLikeFahrenheit: data.temperatureFeelsLikeFahrenheit,
          weatherDescription: data.weatherDescription,
        });
      });
    });
  };

  const midwayData = (midwayLatitude, midwayLongitude, radius) => {
    fetch(
      `https://wft-geo-db.p.rapidapi.com/v1/geo/locations/${midwayLatitude}${midwayLongitude}/nearbyCities?radius=${radius}`,
      {
        method: "GET",
        headers: {
          "x-rapidapi-key":
            "5ab0b683f6msha36a3d89e07fe53p15ec08jsne65a29cbe42a",
          "x-rapidapi-host": "wft-geo-db.p.rapidapi.com", // not needed to work so far, but they have it in the api docs on rapid api
        },
      }
    ).then((result) => {
      result.json().then((data) => {
        const cities = data["data"];
        let midwayPointCity = "";
        if (cities !== undefined && cities.length > 0) {
          midwayPointCity = cities[0]["city"] + ": " + cities[0]["region"];
        } else {
          midwayPointCity = `No major city within ${radius} miles!`;
        }

        setMidwayGPS({
          midwayGPSLatitude: midwayLatitude,
          midwayGPSLongitude: midwayLongitude,
          midwayPointCity: midwayPointCity,
        });
      });
    });
  };

  const pullCompassData = () => {
    fetch(`/api/lock/${lockId}/pull-compass`, {
      method: "get",
      headers: {
        "Content-Type": "application/json",
      },
    }).then((response) => {
      response.json().then((data) => {
        if (user["initiatorOrJoiner"] === "initiator") {
          setLinkedCompassDirection(data.joinerCompassDirection);
          setPartnerIsLocked(data.joinerLocked);
        } else {
          setLinkedCompassDirection(data.initiatorCompassDirection);
          setPartnerIsLocked(data.initiatorLocked);
        }
      });
    });
  };

  const pushAndPullData = () => {
    const postData = {
      compassDirection: myCompassDirection,
      initiatorOrJoiner: user["initiatorOrJoiner"],
      locked: locked,
      lockId: lockId,
      midwayGPSLatitude: midwayGPS["midwayGPSLatitude"],
      midwayGPSLongitude: midwayGPS["midwayGPSLongitude"],
      midwayPointCity: midwayGPS["midwayPointCity"],
      userId: user.id,
    };

    fetch(`/api/lock/${lockId}/push-compass`, {
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(postData),
    });

    pullCompassData();
  };

  const pushCompassData = () => {
    setToggleButton(false);
    getGeolocationData();

    if (detectIfMobileBrowser() === false) {
      const compassDirection = 20;
      setMyCompassDirection(compassDirection);

      const postData = {
        compassDirection: compassDirection,
        // this breaks on a page refresh
        // it'd be better to add it to the original user object
        initiatorOrJoiner: user["initiatorOrJoiner"],
        locked: locked,
        lockId: lockId,
        midwayGPSLatitude: midwayGPS["midwayGPSLatitude"],
        midwayGPSLongitude: midwayGPS["midwayGPSLongitude"],
        midwayPointCity: midwayGPS["midwayPointCity"],
        userId: user.id,
      };

      fetch(`/api/lock/${lockId}/push-compass`, {
        method: "post",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      });
      pullCompassData();
    } else {
      setRunningCompass(true);
    }
  };

  useEffect(() => {
    const isMobile = detectIfMobileBrowser();

    if (isMobile === false) {
      setViewHeight("86.5vh");
    }
  }, []);

  useEffect(() => {
    if (geolocation !== null) {
      calculateBearing();
    }
  }, [geolocation]);

  useEffect(() => {
    checkIfLocked();
    pushAndPullData();
  }, [myCompassDirection]);

  useEffect(() => {
    if (revealJoe === true) {
      setThemeColor(joeColor);
    } else {
      setThemeColor("purple");
    }
  }, [revealJoe]);

  useEffect(() => {
    if (runningCompass === true) {
      window.addEventListener("deviceorientation", inner);

      return () => {
        window.removeEventListener("deviceorientation", inner);
      };
    }
  }, [runningCompass]);

  return (
    <Grid
      style={{ height: viewHeight, margin: "0", padding: "0" }}
      textAlign="center"
    >
      <Grid.Row style={{ height: "16.5vh", margin: "0", padding: "0" }}>
        <Grid.Column style={{ margin: "0", padding: "0" }}>
          <Grid.Row style={{ margin: "0", padding: "0" }}>
            <Image
              margin="0"
              padding="0"
              centered
              size="small"
              src={revealJoe ? "/joelock/joelock.png" : "/logo-title.png"}
            />
          </Grid.Row>
        </Grid.Column>
      </Grid.Row>
      <Grid.Row style={{ height: "41vh", margin: "0", padding: "0" }}>
        {toggleButton ? (
          <>
            <Grid.Row style={{ height: "32vh", margin: "0", padding: "0" }}>
              <Grid.Column style={{ margin: "0", padding: "0" }}>
                {/* {toggleButton ? ( */}
                <div>
                  <br />
                  <br />
                  <br />
                  <Button
                    onClick={pushCompassData}
                    centered
                    color={revealJoe ? null : themeColor}
                    inverted
                    size="massive"
                    style={
                      revealJoe
                        ? { backgroundColor: joeColor, color: "#F1F1F1" }
                        : null
                    }
                  >
                    {revealJoe ? "Start a JoeLock" : "Start Lock"}
                  </Button>
                </div>
                {/* ) : null} */}
              </Grid.Column>
            </Grid.Row>
            <Grid.Row style={{ margin: "0", padding: "0" }}>
              {/* {toggleButton ? ( */}
              <Message
                color={revealJoe ? null : themeColor}
                compact
                inverted={revealJoe ? true : false}
                size="large"
                style={
                  revealJoe
                    ? { backgroundColor: themeColor, color: "#F1F1F1" }
                    : null
                }
              >
                <Message.Header>
                  {revealJoe ? "JoeLock Id" : "Lock Id"}
                </Message.Header>
                {lockId}
              </Message>
            </Grid.Row>
          </>
        ) : (
          <Grid.Column>
            <Button
              onClick={endLock}
              color={revealJoe ? null : themeColor}
              inverted
              size="massive"
              style={
                revealJoe
                  ? { backgroundColor: themeColor, color: "#F1F1F1" }
                  : null
              }
            >
              {revealJoe ? "End the JoeLock" : "End Lock"}
            </Button>
          </Grid.Column>
        )}
      </Grid.Row>
    </Grid>
  );
}
