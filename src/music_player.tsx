import { Component } from 'react';
import { GameId, HouseId, PlayerId, Point } from './api';
import Button from './button';
import ExpandCollapseToggle from './expand_collapse_toggle';
import './music_player.css';

interface MusicPlayerProps { }

interface MusicPlayerState {
    expanded: boolean
    currentSong: number
    playing: boolean
}

interface AudioAtlasSongs {
    path: string
    title: string
}

class MusicPlayer extends Component<MusicPlayerProps, MusicPlayerState> {

    private audioAtlasSongs?: AudioAtlasSongs[]
    private audioInstances: HTMLAudioElement[]

    constructor(props: MusicPlayerProps) {
        super(props);

        this.audioInstances = []

        this.state = {
            expanded: false,
            currentSong: 0,
            playing: false
        }
    }

    async componentDidMount() {
        const result = await fetch('assets/audio-atlas-music.json')

        this.audioAtlasSongs = await result.json()

        this.audioAtlasSongs?.forEach(song => this.audioInstances.push(new Audio(song.path)))
    }

    componentWillUnmount() { }

    play(): void {
        if (this.audioAtlasSongs) {
            this.audioInstances[this.state.currentSong].onended = () => { this.next() }
            this.audioInstances[this.state.currentSong].play()

            this.setState({ playing: true })
        }
    }

    pause(): void {
        if (this.audioAtlasSongs) {
            this.audioInstances[this.state.currentSong].pause()

            this.setState({ playing: false })
        }
    }

    next(): void {
        if (this.state.playing) {
            this.audioInstances[this.state.currentSong].pause()
        }

        const currentSong = this.state.currentSong
        let newSong

        if (currentSong < this.audioInstances.length - 1) {
            newSong = currentSong + 1
        } else {
            newSong = 0
        }

        if (this.state.playing) {
            this.audioInstances[newSong].fastSeek(0)
            this.audioInstances[newSong].onended = () => { this.next() }
            this.audioInstances[newSong].play()
        }

        this.setState({ currentSong: newSong })
    }

    render() {

        return (
            <div className="MusicPlayer">

                <ExpandCollapseToggle onExpand={() => this.setState({ expanded: true })} onCollapse={() => this.setState({ expanded: false })} inverted />
                <div> <b>Music</b></div>

                {this.state.playing && this.audioAtlasSongs && this.state.expanded &&
                    <div> Playing: {this.audioAtlasSongs[this.state.currentSong].title} </div>
                }

                {this.state.expanded &&
                    <>
                        <div>
                            {this.state.playing &&
                                <span><Button onButtonClicked={this.pause.bind(this)} label="Pause" /></span>
                            }

                            {!this.state.playing &&
                                <span><Button onButtonClicked={this.play.bind(this)} label="Play" /></span>
                            }

                            <span><Button onButtonClicked={this.next.bind(this)} label="Next" /></span>
                        </div>

                        <div id="SongList">

                            {this.audioAtlasSongs &&
                                this.audioAtlasSongs.map(
                                    (song, index) => {

                                        return (
                                            <div className={(index === this.state.currentSong) ? "PlayingSongItem" : "SongItem"} key={index}>
                                                {song.title}
                                            </div>
                                        )
                                    }
                                )
                            }
                        </div>
                    </>
                }
            </div>
        );
    }
}

export default MusicPlayer;