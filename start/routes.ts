/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| This file is dedicated for defining HTTP routes. A single file is enough
| for majority of projects, however you can define routes in different
| files and just make sure to import them inside this file. For example
|
| Define routes in following two files
| ├── start/routes/cart.ts
| ├── start/routes/customer.ts
|
| and then import them inside `start/routes.ts` as follows
|
| import './routes/cart'
| import './routes/customer'
|
*/

import Route from '@ioc:Adonis/Core/Route'

Route.get('/', async () => {
  return { hello: 'world' }
})

Route.group(() => {
  Route.post('/register', 'AuthController.register')
  Route.post('/login', 'AuthController.login')
  Route.post('/logout', 'AuthController.logout').middleware('auth:web')
  Route.get('/me', 'AuthController.me').middleware('auth:web')

  
  Route.get('/auth/google', 'AuthController.redirectToGoogle')
  Route.get('/auth/google/callback', 'AuthController.handleGoogleCallback')


  Route.get('/auth/github', 'AuthController.redirectToGithub')
  Route.get('/auth/github/callback', 'AuthController.handleGithubCallback')


  Route.get('/auth/discord', 'AuthController.redirectToDiscord')
  Route.get('/auth/discord/callback', 'AuthController.handleDiscordCallback')


  Route.group(() => {
      Route.post('/requests', 'LeaveController.create') 
      Route.get('/requests', 'LeaveController.index') 
      Route.get('/requests/:id', 'LeaveController.show') 
      Route.delete('/requests/:id', 'LeaveController.delete')
      Route.get('/quota', 'LeaveController.getMyQuota') 

      Route.get('/admin/requests', 'LeaveController.getAllRequests') 
      Route.get('/admin/requests/deleted', 'LeaveController.getDeletedRequests')
      Route.patch('/admin/requests/:id/status', 'LeaveController.updateStatus')
      Route.post('/admin/requests/:id/restore', 'LeaveController.restore')
    }).middleware('auth:web')
    .prefix('/leave')

}).prefix('/api/v1')
