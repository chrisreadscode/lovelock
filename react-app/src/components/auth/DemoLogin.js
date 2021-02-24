import React, { useEffect, useState } from "react";
import { Redirect } from "react-router-dom";

import { login } from "../../services/auth";

const DemoLogin = ({ authenticated, setAuthenticated, setUser }) => {
  const [viewHeight, setViewHeight] = useState("74.5vh");
  useEffect(() => {
    const isMobile = detectIfMobileBrowser();

    if (isMobile === false) {
      setViewHeight("86.5vh");
    }
  }, []);

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

  const [errors, setErrors] = useState([]);

  if (authenticated) {
    return <Redirect to="/" />;
  }

  const demoLogin = async () => {
    const email = "demo@demo.com";
    const password = "password";
    const user = await login(email, password);
    if (!user.errors) {
      setAuthenticated(true);
      setUser(user);
      return <Redirect to="/" />;
    } else {
      setErrors(user.errors);
    }
  };

  demoLogin();

  return <div style={{ height: viewHeight, margin: "0px" }}></div>;
};

export default DemoLogin;