import { Context, Scenes } from 'telegraf';

interface WizardSession extends Scenes.WizardSessionData {
  subscribeData: {
    to?: string;
    from?: string;
    status?: string;
  };
}

export interface MyContext extends Context {
  myContextProp?: string;
  session: Scenes.SceneSession<WizardSession>;
  scene: Scenes.SceneContextScene<MyContext, WizardSession>;
  wizard: Scenes.WizardContextWizard<MyContext>;
}
