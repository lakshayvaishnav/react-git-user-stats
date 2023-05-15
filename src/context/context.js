import React, { useState, useEffect, createContext } from "react";
import mockUser from "./mockData.js/mockUser";
import mockRepos from "./mockData.js/mockRepos";
import mockFollowers from "./mockData.js/mockFollowers";
import axios from "axios";
import { useFetcher } from "react-router-dom";

const rootUrl = "https://api.github.com";

const GithubContext = createContext();

//provider consumer

const GithubProvider = ({ children }) => {
  const [githubUser, setgithubUser] = useState(mockUser);
  const [repos, setrepos] = useState(mockRepos);
  const [followers, setfollowers] = useState(mockFollowers);
  //request loading
  const [requests, setrequests] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  // errors
  const [error, setError] = useState({ show: false, msg: "" }); 

  const searchGithubUser = async (user) => {
    toggleError();
    setIsLoading(true);
    // setloading(true)
    const response = await axios(`${rootUrl}/users/${user}`).catch((err) =>
      console.log(err)
    );
    if (response) {
      setgithubUser(response.data);
      const { login, followers_url } = response.data;

      await Promise.allSettled([
        axios(`${rootUrl}/users/${login}/repos?per_page=100`),
        axios(`${followers_url}?per_page=100`),
      ]).then((results)=>{

          const [repos,followers] = results
          const status= 'fulfilled'
          if(repos.status === status){
            setrepos(repos.value.data)
            
          }

          if(followers.status === status){
            setfollowers(followers.value.data)
            
          }
          
      }).catch(err=>console.log(err))

      // more logic here...
      // repos
      // https://api.github.com/users/john-smilga/repos?per_page=100
      // followers
      // https://api.github.com/users/john-smilga/followers
    } else {
      toggleError(true, "there is no user with the following name");
    }
    checkRequest();
    setIsLoading(false);
  };
  // check rate
  const checkRequest = () => {
    axios(`${rootUrl}/rate_limit`)
      .then(({ data }) => {
        let {
          rate: { remaining },
        } = data;

        setrequests(remaining);
        if (remaining === 0) {
          //throw an error
          toggleError(true, "sorry you have exceeded your hourly api limit!");
        }
      })
      .catch((err) => console.log(err));
  };

  function toggleError(show = false, msg = "") {
    setError({ show, msg });
  }
  // error
  useEffect(checkRequest, []);

  return (
    <GithubContext.Provider
      value={{
        githubUser,
        repos,
        followers,
        requests,
        error,
        searchGithubUser,
        isLoading,
      }}
    >
      {children}
    </GithubContext.Provider>
  );
};

export { GithubContext, GithubProvider };
