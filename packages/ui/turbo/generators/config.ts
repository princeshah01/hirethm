import type { PlopTypes } from '@turbo/gen';

export default function generator(plop: PlopTypes.NodePlopAPI): void {
  plop.setGenerator('react-component', {
    description: 'Add a new React component to @repo/ui',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'What is the name of the component?',
      },
    ],
    actions: [
      {
        type: 'add',
        path: 'src/{{kebabCase name}}.tsx',
        templateFile: 'templates/component.hbs',
      },
    ],
  });
}
