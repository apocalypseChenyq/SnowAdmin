import { chalk } from "zx";
import inquirer from "inquirer";
import { generateService_test } from "./test";
const nameMap = {
  generateService_test
};

void (async function () {
  type Answers = {
    services: (keyof typeof nameMap)[];
  };
  const answers: Answers = await inquirer.prompt([
    {
      type: "checkbox",
      name: "services",
      message: "请选择要生成的 service",
      pageSize: 30,
      default: [],
      choices: Object.keys(nameMap).map(name => ({ name }))
    }
  ]);
  if (!answers.services?.length) console.log(chalk.red("请至少运行一个 service ！！！"));

  answers.services.forEach(name => {
    const fn = nameMap[name];
    if (fn) fn();
    else console.log(chalk.red(`没有找到 ${name} 对应的函数`));
  });
})();
