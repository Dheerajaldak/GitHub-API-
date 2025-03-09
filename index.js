
const express = require('express');
const axios = require('axios');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(morgan('dev'));

app.get('/', (req, res) => {
    res.send('Hello, Backend Test, Mar 9 2025');
  });

const GITHUB_API_URL = 'https://api.github.com';

// Helper function to fetch GitHub data
const fetchGitHubData = async (endpoint) => {
  try {
    const response = await axios.get(`${GITHUB_API_URL}${endpoint}`, {
      headers: {
        Authorization: `token ${process.env.GITHUB_TOKEN}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching data from GitHub:', error);
    throw new Error('Failed to fetch GitHub data');
  }
};

// Route to get general GitHub info
app.get('/github', async (req, res) => {
  try {
    const userData = await fetchGitHubData(`/users/${process.env.GITHUB_USERNAME}`);
    const reposData = await fetchGitHubData(`/users/${process.env.GITHUB_USERNAME}/repos`);
    res.json({
      username: userData.login,
      followers: userData.followers,
      following: userData.following,
      publicRepos: reposData.length,
      repos: reposData.map(repo => ({
        name: repo.name,
        description: repo.description,
        url: repo.html_url,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch GitHub data' });
  }
});

// Route to get data about a specific repository
app.get('/github/:repoName', async (req, res) => {
  const { repoName } = req.params;
  try {
    const repoData = await fetchGitHubData(`/repos/${process.env.GITHUB_USERNAME}/${repoName}`);
    res.json({
      name: repoData.name,
      description: repoData.description,
      language: repoData.language,
      stars: repoData.stargazers_count,
      forks: repoData.forks_count,
      issuesUrl: repoData.issues_url.replace('{/number}', ''),
    });
  } catch (error) {
    res.status(404).json({ error: `Repository ${repoName} not found` });
  }
});

// Route to create a GitHub issue
app.post('/github/:repoName/issues', express.json(), async (req, res) => {
  const { repoName } = req.params;
  const { title, body } = req.body;

  if (!title || !body) {
    return res.status(400).json({ error: 'Title and body are required' });
  }

  try {
    const issueData = await axios.post(
      `${GITHUB_API_URL}/repos/${process.env.GITHUB_USERNAME}/${repoName}/issues`,
      {
        title,
        body,
      },
      {
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
        },
      }
    );
    res.json({
      message: 'Issue created successfully',
      issueUrl: issueData.data.html_url,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create issue' });
  }
});

  

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
