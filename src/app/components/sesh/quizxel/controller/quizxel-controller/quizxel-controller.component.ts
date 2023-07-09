import {Component} from '@angular/core';
import {SheshServiceService} from "../../../../../service/shesh-service.service";
import {ActivatedRoute, Router} from "@angular/router";
import {QuizxelStateMessage} from "../../model/message/QuizxelStateMessage";
import {QuizxelPlayer} from "../../model/QuizxelPlayer";
import {SeshStage} from "../../../model/SeshStage";
import {SeshCommand} from "../../../model/SeshCommand";
import {QuizxelErrorMessage} from "../../model/message/QuizxelErrorMessage";
import {Subscription} from "rxjs";
import {QuizxelQuestion} from "../../model/question/QuizxelQuestion";
import {SeshAction} from "../../../model/action/SeshAction";
import {LobbyState} from "../../model/LobbyState";
import {QuizxelMainState} from "../../model/QuizxelMainState";


@Component({
  selector: 'app-quizxel-controller',
  templateUrl: './quizxel-controller.component.html',
  styleUrls: ['./quizxel-controller.component.css']
})
export class QuizxelControllerComponent {

  seshCode = ""
  players: QuizxelPlayer[] = []
  currentStage: SeshStage = SeshStage.LOBBY;
  playerName = ""
  playerId = ""
  private subscription: Subscription = new Subscription();
  isVIP = false;
  currentQuestion = <QuizxelQuestion>{};
  needToAskForVip = true;
  lobbyState = <LobbyState>{};
  mainState = <QuizxelMainState>{};

  constructor(private seshService: SheshServiceService, private route: ActivatedRoute, private router: Router) {
  }

  ngOnInit(): void {

    this.route.paramMap.subscribe(params => {
        this.seshCode = <string>params.get("seshCode")
        this.playerName = <string>params.get("playerName")

        this.subscription = this.seshService.joinSeshAsController(this.seshCode, this.playerName).subscribe(iMessage => {

          const message = JSON.parse(iMessage.body)

          if ('state' in message) {

            this.handleStateMessage(<QuizxelStateMessage>message)

          } else if ("error" in message) {

            this.handleErrorMessage(<QuizxelErrorMessage>message)
          }
        })
      }
    )
  }

  private handleStateMessage(message: QuizxelStateMessage) {

    let state = message.state;
    state = this.extractState(state)
    this.currentStage = state.currentStage;
  }

  private extractState(state: LobbyState): LobbyState {

    if (this.lobbyState !== state) {

      this.currentStage = state.currentStage;
      this.lobbyState = state;
      this.players.forEach(player => {
        if (player.vip) this.needToAskForVip = false;
      });
      state.players.filter((player) => player.playerName === this.playerName).forEach((player) => {
        this.playerId = player.playerId;
        this.isVIP = player.vip;
      });
    }
    return this.lobbyState;
  }

  makeVIP(action: SeshAction) {

    if (action.body !== false) {

      const makeVIPCommand: SeshCommand = {action: action}
      this.seshService.sendCommand(makeVIPCommand, this.seshCode)
    }

    this.needToAskForVip = false
  }

  private handleErrorMessage(message: QuizxelErrorMessage) {

    this.subscription.unsubscribe()
    console.log(message)
    this.router.navigateByUrl("/home")
  }

  startSesh(value: boolean) {

    const startSeshAction: SeshAction = {type: "startSesh", body: undefined};
    const command: SeshCommand = {action: startSeshAction}
    this.seshService.sendCommand(command, this.seshCode);
  }
}
