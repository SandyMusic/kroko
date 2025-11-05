const { Client } = require('discord.js-selfbot-v13');
var figlet = require('figlet');
var colors = require('colors');
const client = new Client({ checkUpdate: false });
const axios = require('axios');
const fs = require('fs');
const inquirer = require('inquirer');
const open = require('open');
var historicoMensagens = [];
var contadorRecursao = 0;
process.title = 'Krokodil';

const per = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

client.on('ready', async () => {
  async function loop() {
    console.clear();
    figlet.text(client.user.username, {
      font: 'Bloody',
    }, function (err, data) {
      if (err) {
        console.log('algum erro no input');
        console.dir(err);
        return;
      }
      console.log(colors.red(data));
      console.log(colors.red('         feito por byy\n\n'));

      const options = [{
        name: '[+] Abrir todas as DMs e apagar (amigos)',
        value: 'opção_1'
      }, {
        name: '[+] Apagar mensagens das DMs abertas',
        value: 'opção_2'
      }, {
        name: '[+] Apagar mensagens de um canal/usuário',
        value: 'opção_3'
      }, {
        name: '[+] Remover todos os amigos',
        value: 'opção_4'
      }, {
        name: '[+] Remover pedidos de amizade',
        value: 'opção_5'
      }, {
        name: '[+] Mover/desconectar todos de um canal de voz',
        value: 'opção_6'
      }, {
        name: '[+] Anti-DM',
        value: 'opção_7'
      }];

      inquirer.prompt([{
        type: 'list',
        name: 'option',
        message: 'Escolha uma opção:',
        choices: options,
      }]).then(async answers => {
        const { option } = answers;
        console.clear();

        if (option == 'opção_1') {
          var amigos = await pegar_amigos();
          if (amigos.length <= 0) return console.log(colors.red('[x] você não possui amigos na sua lista')), esperarkk('\nAguarde 5 segundos...')
          for (var usr of amigos) {
            if (usr) {
              var us = await client.users.fetch(usr.id).catch(() => { })
              await new Promise(resolve => setTimeout(resolve, 1000));
              await us?.createDM().then(async dm => {
                var todas_msg = await fetch_msgs(dm.id)
                if (todas_msg.length == 0) console.log(colors.red(`[x] Sem nenhuma mensagem com o usuário ${dm.recipient.username}, indo pra proxima`))
                const breakerror = {}
                let contador = 1
                try {
                  for (var msg of todas_msg) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    console.log(colors.yellow(`[Apagando] ${msg.content ? msg.content : "[Mensagem sem conteúdo]"}`));
                    contador++
                    console.log(colors.green(`[=] Foram apagadas o total de ${contador} de ${todas_msg.length} com o usuário ${dm.recipient.username}`));
                    await msg.delete().catch((e) => {
                      if (e.message == "Could not find the channel where this message came from in the cache!") {
                        throw breakerror;
                      }
                    })
                  }
                  await fechar_dm(dm.id)
                } catch (e) {
                  if (e !== breakerror) throw e;
                }
              })
            }
          }
          esperarkk(`\n\n[!] terminei de limpar todas as dms, voltando para o inicio, aguarde 5 segundos...`)
        } else if (option == 'opção_2') {
          var tds_dm = await client.channels.cache.filter(c => c.type == "DM").map(a => a.recipient.id)
          if (tds_dm.length <= 0) return console.log(colors.red('[x] você não possui dms abertas')), esperarkk('\nAguarde 5 segundos...')
          for (var usr of tds_dm) {
            let contador = 1;
            let nome;
            let canal = client.channels.cache.get(usr);
            if (!canal) {
              var usr = await client.users.fetch(usr).catch(() => {
                console.log(colors.red('[x] Não consegui ver a dm com esse usuário'));
              });
              await usr.createDM().then(dmchannel => {
                id = dmchannel.id;
                nome = usr.username;
              }).catch(e => {
                console.log(colors.red('[x] Não consegui ver a dm com esse usuário'));
              });
            } else {
              nome = (canal.type == "GROUP_DM") ? "DM" : canal.name;
            }
            var todas_msg = await fetch_msgs(id);
            if (!todas_msg.length) console.log(colors.red(`[x] Sem mensagens na dm com o usuário ${nome}`)), await fechar_dm(id);
            for (var nuts of todas_msg) {
              await new Promise(resolve => setTimeout(resolve, 1000));
              console.log(colors.yellow(`[Apagando] ${nuts.content ? nuts.content : "[Mensagem sem conteúdo]"}`));
              await nuts.delete().then(kk => {
                console.log(colors.green(`[=] Foram apagadas o total de ${contador} de ${todas_msg.length} com o usuário ${nome}`));
                contador++;
              }).catch((e) => { console.log(e); });
            }
            await fechar_dm(id);
          }
          esperarkk(`\n\n[!] terminei de limpar todas as dms, voltando para o inicio, aguarde 5 segundos...`);
        } else if (option == 'opção_3') {
          inquirer.prompt([
            {
              type: 'list',
              name: 'option',
              message: '[=] Selecione uma opção:',
              choices: ['[x] Apenas apagar DM com o usuário', '[x] Salvar DM', '[x] Cancelar']
            }
          ]).then(async firstAnswers => {
            console.clear();

            if (firstAnswers.option === '[x] Cancelar') {
              return console.log(colors.red(`[x] operação cancelada com sucesso, voltando ao inicio, aguarde 5 segundos...`)), esperarkk('');
            }

            console.clear();
            inquirer.prompt([
              {
                type: 'input',
                name: 'ids',
                message: '[=] Insira os IDs dos canais/usuários (separe por espaços):',
                when: function (answers) {
                  return answers.option !== 'Cancelar';
                }
              }
            ]).then(async secondAnswers => {
              console.clear();
              let ids = secondAnswers.ids.split(' '); // Quebra os IDs por espaço

              for (let id of ids) {
                let contador = 1;
                let nome;

                let canal = await client.channels.cache.get(id);
                if (!canal) {
                  var usr = await client.users.fetch(id).catch(err => { });
                  if (!usr) {
                    console.log(colors.red(`[x] O ID fornecido ${id} é inválido`));
                    continue; // Pula para o próximo ID
                  }

                  await usr?.createDM().then(dmchannel => {
                    id = dmchannel.id;
                    nome = usr.username;
                  }).catch(e => {
                    console.log(colors.red(`[x] Não consegui ver a DM com o usuário ${id}`));
                  });
                } else {
                  nome = (canal?.recipient?.username) ? canal.recipient.username : canal.name;
                }

                var todas_msg = await fetch_msgs(id);
                if (todas_msg.length === 0) {
                  console.log(colors.red(`[x] Sem mensagens na DM com o usuário/canal ${nome}`));
                  await fechar_dm(id);
                  continue; // Pula para o próximo ID
                }

                for (var nuts of todas_msg) {
                  await new Promise(resolve => setTimeout(resolve, 1000));
                  
                  // Log da mensagem que está sendo apagada
                  console.log(colors.yellow(`[Apagando] ${nuts.content ? nuts.content : "[Mensagem sem conteúdo]"}`));
                  
                  await nuts.delete().then(() => {
                    console.log(colors.green(`[=] Foram apagadas o total de ${contador} de ${todas_msg.length} mensagens com o usuário/canal ${nome}`));
                    contador++;
                  }).catch((e) => {
                    console.log(e);
                  });
                }
                await fechar_dm(id);
              }

              esperarkk(`\n\n[!] Terminei de limpar todas as DMs/canais, voltando para o início, aguarde 5 segundos...`);
            });
          });
        } else if (option == 'opção_4') {
          let contador = 1;
          var amigos = await pegar_amigos();

          for (var kk of amigos) {
            if (kk.type === 1) {
              try {
                await new Promise(resolve => setTimeout(resolve, 2000));
                axios.delete(`https://discord.com/api/v9/users/@me/relationships/${kk.id}`, {
                  headers: {
                    'Authorization': client.token
                  }
                });
                console.log(colors.green(`[-] ${contador} amizades removidas com sucesso`));
                contador++;
              } catch { }
            }
          }
          esperarkk(`\n\n[!] terminei de remover os amigos...`);
        } else if (option == 'opção_5') {
          let contador = 1;
          var amigos = await pegar_amigos();

          for (var kk of amigos) {
            if (kk.type === 3) {
              try {
                await new Promise(resolve => setTimeout(resolve, 2000));
                axios.delete(`https://discord.com/api/v9/users/@me/relationships/${kk.id}`, {
                  headers: {
                    'Authorization': client.token
                  }
                });
                console.log(colors.green(`[-] ${contador} pedidos de amizade removidos com sucesso`));
                contador++;
              } catch { }
            }
          }
          esperarkk(`\n\n[!] terminei de remover os pedidos de amizade...`);
        }
      });
    });
  }

  return loop();

  function esperarkk(fofokk) {
    console.log(fofokk);
    setTimeout(function () {
      return loop();
    }, 5000);
  }
});

async function fetch_msgs(canal) {
  const canall = client.channels.cache.get(canal);
  if (!canall) return [];
  let ultimoid;
  let messages = [];

  while (true) {
    const fetched = await canall.messages.fetch({
      limit: 100,
      ...(ultimoid && { before: ultimoid }),
    });

    if (fetched.size === 0) {
      return messages.filter(msg => msg.author.id == client.user.id && !msg.author.system && !msg.system);
    }
    messages = messages.concat(Array.from(fetched.values()));
    ultimoid = fetched.lastKey();
  }
}

async function pegar_amigos() {
  await new Promise(resolve => setTimeout(resolve, 2000));
  return axios.get('https://discord.com/api/v9/users/@me/relationships', {
    headers: {
      'Authorization': client.token,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
      'X-Super-Properties': 'eyJvcyI6IldpbmRvd3MiLCJicm93c2VyIjoiQ2hyb21lIiwiZGV2aWNlIjoiIiwic3lzdGVtX2xvY2FsZSI6InB0LUJSIiwiYnJvd3Nlcl91c2VyX2FnZW50IjoiTW96aWxsYS81LjAgKFdpbmRvd3MgTlQgMTAuMDsgV2luNjQ7IHg2NCkgQXBwbGVXZWJLaXQvNTM3LjM2IChLSFRNTCwgbGlrZSBHZWNrbykgQ2hyb21lLzExMC4wLjAuMCBTYWZhcmkvNTM3LjM2IiwiYnJvd3Nlcl92ZXJzaW9uIjoiMTEwLjAuMC4wIiwib3NfdmVyc2lvbiI6IjEwIiwicmVmZXJyZXIiOiJodHRwczovL2Rpc2NvcmQuY29tLyIsInJlZmVycmluZ19kb21haW4iOiJkaXNjb3JkLmNvbSIsInJlZmVycmVyX2N1cnJlbnQiOiIiLCJyZWZlcnJpbmdfZG9tYWluX2N1cnJlbnQiOiIiLCJyZWxlYXNlX2NoYW5uZWwiOiJzdGFibGUiLCJjbGllbnRfYnVpbGRfbnVtYmVyIjoxODU1MTYsImNsaWVudF9ldmVudF9zb3VyY2UiOm51bGwsImRlc2lnbl9pZCI6MH0=',
      'Referer': 'https://discord.com/channels/@me'
    }
  }).then(res => { return res.data }).catch(() => { });
}

async function fechar_dm(dm) {
  await new Promise(resolve => setTimeout(resolve, 2000));
  await axios.delete(`https://discord.com/api/v9/channels/${dm}`, {
    headers: {
      'Authorization': client.token
    }
  }).catch(() => { });
}

client.login(require('./config.json').token).catch(() => {
  console.clear();
  inquirer.prompt([{
    type: 'message',
    name: 'option',
    message: `${colors.red("[!]")} Token inválida, insira uma token:`,
  }]).then(async token => {
    console.clear();
    await client.login(token.option).then(() => {
      fs.writeFileSync('config.json', JSON.stringify({ ativado: false, token: client.token }, null, 2));
    }).catch(() => {
      process.exit();
    });
  });
});
