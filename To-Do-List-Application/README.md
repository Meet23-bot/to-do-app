
![image](https://user-images.githubusercontent.com/83400697/207388229-b6463c21-39cb-4926-98b1-b77f3c2790a1.png)

![image](https://user-images.githubusercontent.com/83400697/202429157-a953dc00-f32d-4312-862a-1902a628b6ba.png)


Join the [discord server](https://discord.gg/JdFsJPrayj) for more discussion: 

# To-Do List Application

This is a To-Do List Application with a browser UI and a Node.js/Express backend API. It allows you to add, edit, complete, and delete tasks.

## Tech Stack

- HTML
- CSS
- JavaScript
- Node.js
- Express
- Docker

## Installation

Clone the repository to your local machine:

```bash
git clone https://github.com/Kritika30032002/To-Do-List-Application.git
```
Run the dynamic server version locally:

```bash
npm install
copy .env.example .env
npm start
```

Environment variables:
- `PORT` - server port (default: `3000`)
- `NODE_ENV` - runtime mode (`development` or `production`)
- `APP_NAME` - app name shown in diagnostics
- `TASKS_FILE` - task storage file path used by the API

## Docker

```bash
docker build -t todo-app:latest .
docker run --rm -p 3000:3000 --env-file .env.production.example todo-app:latest
```

## AWS ECS Deployment Handoff

For a realistic Developer -> DevOps handoff, use:

- `DEPLOYMENT-HANDOFF.md`
- `aws/ecs-task-definition.template.json`

## Usage
1. Add tasks with a simple click.
2. Edit task names.
3. Mark tasks as completed.
4. Delete tasks.

## Contributing
Feel free to contribute to this project by creating a pull request. We welcome any improvements, bug fixes, or new features.

## Why & How to contribute?
- If you find any bugs then please report them by creating an issue. 
- If you can make a website look good by modifying then go ahead and describe it in issue and create pull request. 
- If you can add more functionality, then create an issue and contribute by making pull request.




## Thanks to all Contributors 💪

<a href="https://github.com/Kritika30032002/To-Do-List-Application/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=Kritika30032002/To-Do-List-Application"/>
</a>  <br>
Thanks a lot for spending your time. <br>
Keep rocking 🍻 <br>
Also Give it a Star 🌟, If you loved contributing to the project.

## [MIT Licensed](https://github.com/Kritika30032002/To-Do-List-Application/blob/main/LICENSE)
