import 'phaser';
import RexUIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin.js';

declare module 'phaser' {
  namespace Scene {
    interface Systems {
      rexUI: RexUIPlugin;
    }
  }

  interface Scene {
    rexUI: RexUIPlugin;
  }
}
