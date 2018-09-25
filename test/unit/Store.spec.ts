import { Store } from '../../src/Store';
import { assert, expect } from 'chai';
import * as path from 'path';

let tmpTestDir = path.join(__dirname, '../.tmp');

function storeConnection (name) {
  return {
    client          : 'sqlite3',
    useNullAsDefault: true,
    connection      : {
      filename: `${tmpTestDir}/${name}.sqlite`,
    },
  };
}

describe('Store', () => {
  describe('.constructor()', () => {
    it('should setup a store', () => {
      let store       = new Store('testStore', storeConnection('constructor'));
      let connections = store.getConnections();

      assert.strictEqual(connections[Store.ROLE_MASTER][0], connections[Store.ROLE_SLAVE][0]);
      assert.strictEqual(store.getName(), 'testStore');
    });
  });

  describe('.getName()', () => {
    it('should return the name provided', () => {
      let store = new Store('getNameTest');

      assert.strictEqual(store.getName(), 'getNameTest');
    });
  });

  describe('.getConnections()', () => {
    it('should return the connections', () => {
      let store = new Store('getNameTest');

      assert.deepEqual(store.getConnections(), { [Store.ROLE_SLAVE]: [], [Store.ROLE_MASTER]: [] });
    });
  });

  describe('.register()', () => {
    it('should register connections based on their appearance', () => {
      let store       = new Store('test');
      let pool        = {
        client          : 'sqlite3',
        useNullAsDefault: true,
        connections     : [
          { filename: tmpTestDir + '/registerWithPool-1.sqlite' },
          { filename: tmpTestDir + '/registerWithPool-2.sqlite' },
        ],
      };
      let replication = {
        client          : 'sqlite3',
        useNullAsDefault: true,
        connections     : {
          master: [
            { filename: tmpTestDir + '/registerWithReplication-master-1.sqlite' },
            { filename: tmpTestDir + '/registerWithReplication-master-2.sqlite' },
          ],
          slave : [
            { filename: tmpTestDir + '/registerWithReplication-slave-1.sqlite' },
            { filename: tmpTestDir + '/registerWithReplication-slave-2.sqlite' },
            { filename: tmpTestDir + '/registerWithReplication-slave-3.sqlite' },
          ],
        },
      };

      store.register(storeConnection('simple'));
      store.register(pool);
      store.register(replication);

      let connections = store.getConnections();

      assert.equal(connections[Store.ROLE_MASTER].length, 5);
      assert.equal(connections[Store.ROLE_SLAVE].length, 6);
      assert.strictEqual(connections[Store.ROLE_SLAVE][0], connections[Store.ROLE_MASTER][0]); // Single
      assert.strictEqual(connections[Store.ROLE_SLAVE][1], connections[Store.ROLE_MASTER][1]); // Pool
      assert.strictEqual(connections[Store.ROLE_SLAVE][2], connections[Store.ROLE_MASTER][2]); // Pool
    });
  });

  describe('.registerConnection()', () => {
    it('should throw an exception when provided a wrong role', () => {
      expect(function () {
        let store = new Store('cake');

        store.registerConnection({ connection: {}, client: '' }, 'bad');
      }).to.throw(Error);
    });

    it('should set if role is master', () => {
      let store = new Store('foo');

      store.registerConnection(storeConnection('registerconnection-master'), Store.ROLE_MASTER);

      assert.equal(store.getConnections()[Store.ROLE_MASTER].length, 1);
      assert.equal(store.getConnections()[Store.ROLE_SLAVE].length, 0);
    });

    it('should set if role is slave', () => {
      let store = new Store('foo');

      store.registerConnection(storeConnection('registerconnection-slave'), Store.ROLE_SLAVE);

      assert.equal(store.getConnections()[Store.ROLE_SLAVE].length, 1);
      assert.equal(store.getConnections()[Store.ROLE_MASTER].length, 0);
    });

    it('should set master and slave if role is null', () => {
      let store       = new Store('foo');
      let connections = store.getConnections();

      store.registerConnection(storeConnection('registerconnection-null'));

      assert.equal(connections[Store.ROLE_SLAVE].length, 1);
      assert.equal(connections[Store.ROLE_MASTER].length, 1);
      assert.deepEqual(connections[Store.ROLE_MASTER][0], connections[Store.ROLE_SLAVE][0]);
    });
  });

  describe('.registerPool()', () => {
    it('should register a pool', () => {
      let store       = new Store('foo');
      let connections = store.getConnections();
      let pool        = {
        client          : 'sqlite3',
        useNullAsDefault: true,
        connections     : [
          { filename: tmpTestDir + '/registerPool-1.sqlite' },
          { filename: tmpTestDir + '/registerPool-2.sqlite' },
        ],
      };

      store.registerPool(pool);

      assert.equal(connections[Store.ROLE_MASTER].length, 2);
      assert.equal(connections[Store.ROLE_SLAVE].length, 2);
      assert.strictEqual(connections[Store.ROLE_SLAVE][0], connections[Store.ROLE_MASTER][0]);
      assert.strictEqual(connections[Store.ROLE_SLAVE][1], connections[Store.ROLE_MASTER][1]);
    });
  });

  describe('.registerReplication()', () => {
    it('should register a replication', () => {
      let store       = new Store('foo');
      let connections = store.getConnections();
      let replication = {
        client          : 'sqlite3',
        useNullAsDefault: true,
        connections     : {
          master: [
            { filename: tmpTestDir + '/registerReplication-master-1.sqlite' },
          ],
          slave : [
            { filename: tmpTestDir + '/registerReplication-slave-1.sqlite' },
            { filename: tmpTestDir + '/registerReplication-slave-2.sqlite' },
          ],
        },
      };

      store.registerReplication(replication);

      assert.equal(connections[Store.ROLE_MASTER].length, 1);
      assert.equal(connections[Store.ROLE_SLAVE].length, 2);
    });
  });

  // @todo write tests
  describe('.getConnection()', () => {
    it('should return a regular connection', () => {

    });

    it('should return a connection from replication', () => {

    });

    it('should return a connection (round robin) from replication', () => {

    });

    it('should return a connection (round robin) from pool', () => {

    });
  });
});
