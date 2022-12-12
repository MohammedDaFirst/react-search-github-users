import React, { useState, useEffect } from 'react';
import mockUser from './mockData.js/mockUser';
import mockRepos from './mockData.js/mockRepos';
import mockFollowers from './mockData.js/mockFollowers';
import axios from 'axios';

const rootUrl = 'https://api.github.com';

const GithubContext = React.createContext();

// Provider, Consumer - GithubContext.Provider

const GithubProvider = ({ children }) => {
    const [githubUser, setGithubUser] = useState(mockUser);
    const [repos, setRepos] = useState(mockRepos);
    const [followers, setFollowers] = useState(mockFollowers);
    const [requests, setRequests] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    const searchGithubUser = async (user) => {
        toggleError();
        setIsLoading(true);
        const response = await axios(`${rootUrl}/users/${user}`)
            .catch((error) => { console.log(error) })
        if (response) {
            setGithubUser(response.data);
            const { followers_url, repos_url } = response.data;

            await Promise.allSettled([
                axios(`${repos_url}?per_page=100`),
                axios(`${followers_url}?per_page=100`)
            ])
                .then(results => {
                    const [repos, followers] = results;
                    const success = 'fulfilled';
                    if (repos.status === success) {
                        setRepos(repos.value.data);

                    }
                    if (followers.status === success) {
                        setFollowers(followers.value.data);

                    }
                })
                .catch((err) => { console.log(err); })

        } else {
            toggleError(true, "there's no user with such username D:");
        }
        checkRequests();
        setIsLoading(false);
    }

    //check rate
    const [error, setError] = useState({ show: false, msg: '', })
    const checkRequests = () => {
        axios(`${rootUrl}/rate_limit`)
            .then(({ data }) => {
                let { rate: { remaining } } = data;
                setRequests(remaining)
                if (!remaining) {
                    toggleError(true, 'Ugh! Sorry, you ran out of requests. Come again an hour later.')
                }
            })
            .catch((error) => console.log(error))
    };
    //error, no user
    function toggleError(show = false, msg = '') {

        setError({ show, msg })
    }
    useEffect(checkRequests, [])

    return <GithubContext.Provider value={{
        githubUser, repos, followers,
        requests, error, searchGithubUser, isLoading
    }}>{children}
    </GithubContext.Provider>
}

export { GithubProvider, GithubContext }