using System;
using System.Collections.Generic;
using System.Linq;

namespace JogoDetetive
{
    class Program
    {
        static void Main(string[] args)
        {
            var game = new Game();
            game.Run();
        }
    }

    public class Game
    {
        private Map _map;
        private Player _player;
        private List<Suspect> _suspects;

        public Game()
        {
            _map = Map.CreateSampleMap();
            _player = new Player { CurrentLocation = _map.Locations.First() };
            _suspects = Suspect.SampleSuspects();
        }

        public void Run()
        {
            Console.Clear();
            Console.WriteLine("--- Jogo Detetive: Charadas (Matemática & Química) ---\n");
            Console.WriteLine("Você é um detetive. Explore locais, resolva charadas e descubra o culpado.\n");

            while (true)
            {
                ShowStatus();
                Console.WriteLine("Comandos: mapa | ir <local> | inspecionar | recompor | suspeitos | acusar <nome> | sair");
                Console.Write("Digite um comando: ");
                var line = Console.ReadLine()?.Trim();
                if (string.IsNullOrEmpty(line)) continue;

                var parts = line.Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
                var cmd = parts[0].ToLowerInvariant();
                var arg = parts.Length > 1 ? parts[1] : null;

                switch (cmd)
                {
                    case "mapa":
                        _map.PrintMap(_player);
                        break;
                    case "ir":
                        if (arg == null) { Console.WriteLine("Diga para qual local deseja ir (ex: ir Biblioteca)"); break; }
                        GoTo(arg);
                        break;
                    case "inspecionar":
                        Inspect();
                        break;
                    case "recompor":
                        ShowCluesSoFar();
                        break;
                    case "suspeitos":
                        PrintSuspects();
                        break;
                    case "acusar":
                        if (arg == null) { Console.WriteLine("Diga quem você quer acusar (ex: acusar Carlos)"); break; }
                        Accuse(arg);
                        break;
                    case "sair":
                        Console.WriteLine("Saindo... Obrigado por jogar!");
                        return;
                    default:
                        Console.WriteLine("Comando desconhecido.");
                        break;
                }

                if (_map.AllPuzzlesSolved())
                {
                    Console.WriteLine("\nVocê solucionou todas as charadas — agora recomponha o caso (use 'suspeitos' e depois 'acusar <nome>').\n");
                }
            }
        }

        private void ShowStatus()
        {
            Console.WriteLine($"Local atual: {_player.CurrentLocation.Name} | Pistas resolvidas: {_map.SolvedCount()}/{_map.TotalPuzzles()}\n");
        }

        private void GoTo(string name)
        {
            var loc = _map.FindLocationByName(name);
            if (loc == null) { Console.WriteLine("Local não encontrado."); return; }
            _player.CurrentLocation = loc;
            Console.WriteLine($"Você foi para: {loc.Name} — {loc.Description}");
        }

        private void Inspect()
        {
            var loc = _player.CurrentLocation;
            if (loc.Puzzle == null)
            {
                Console.WriteLine("Nada de interessante aqui.");
                return;
            }

            if (loc.Puzzle.Solved)
            {
                Console.WriteLine("Pista já resolvida: " + loc.Puzzle.ShortResult());
                return;
            }

            Console.WriteLine($"Pista encontrada em {loc.Name}: \n{loc.Puzzle.Prompt}\n");

            int attempts = 0;
            while (!loc.Puzzle.Solved)
            {
                Console.Write("Resposta: ");
                var ans = Console.ReadLine()?.Trim();
                attempts++;

                if (loc.Puzzle.CheckAnswer(ans))
                {
                    Console.WriteLine("Correto! Você ganhou a pista:\n" + loc.Puzzle.RevealClue());
                    loc.Puzzle.Solved = true;
                    loc.Puzzle.SolveTime = DateTime.Now;
                    break;
                }
                else
                {
                    Console.WriteLine("Errado.");
                    if (attempts == 1)
                        Console.WriteLine("Dica: " + loc.Puzzle.Hint);
                    else if (attempts >= 3)
                    {
                        Console.WriteLine("Quer ver a solução (sim/não)?");
                        var r = Console.ReadLine()?.Trim().ToLowerInvariant();
                        if (r == "sim" || r == "s")
                        {
                            Console.WriteLine("Solução: " + loc.Puzzle.SolutionExplanation);
                            loc.Puzzle.Solved = true; 
                            break;
                        }
                    }
                }
            }
        }

        private void ShowCluesSoFar()
        {
            Console.WriteLine("Pistas obtidas:");
            foreach (var l in _map.Locations.Where(x => x.Puzzle != null && x.Puzzle.Solved))
            {
                Console.WriteLine($"- {l.Name}: {l.Puzzle.ShortResult()}");
            }
            Console.WriteLine();
        }

        private void PrintSuspects()
        {
            Console.WriteLine("Suspeitos:");
            foreach (var s in _suspects)
            {
                Console.WriteLine($"- {s.Name}: {s.Description}");
            }
        }

        private void Accuse(string name)
        {
            var suspect = _suspects.FirstOrDefault(s => s.Name.Equals(name, StringComparison.OrdinalIgnoreCase));
            if (suspect == null) { Console.WriteLine("Suspeito não encontrado."); return; }

            Console.WriteLine($"Você acusou {suspect.Name}. Confirmar acusação? (sim/não)");
            var r = Console.ReadLine()?.Trim().ToLowerInvariant();
            if (r != "sim" && r != "s") { Console.WriteLine("Acusação cancelada."); return; }

            var culprit = _map.CulpritName;
            if (suspect.Name.Equals(culprit, StringComparison.OrdinalIgnoreCase))
            {
                Console.WriteLine($"Parabéns — você descobriu o culpado: {culprit}!\nCaso solucionado.");
                Environment.Exit(0);
            }
            else
            {
                Console.WriteLine($"{suspect.Name} não é o culpado.\nTente continuar a investigar.");
            }
        }
    }

    public class Map
    {
        public List<Location> Locations { get; set; } = new List<Location>();
        public string CulpritName { get; set; }

        public static Map CreateSampleMap()
        {
            var m = new Map();
            m.CulpritName = "Carlos"; 

            m.Locations.Add(new Location
            {
                Name = "Biblioteca",
                Description = "Prateleiras de livros e papéis espalhados.",
                Puzzle = new Puzzle
                {
                    Category = PuzzleCategory.Matematica,
                    Prompt = "Charada (Matemática): Se 3 caixas contêm 12 maçãs no total e cada caixa tem o mesmo número, quantas maçãs há em cada caixa? Multiplique por 2 para obter a pista final.",
                    AnswerNormalized = "8", 
                    Hint = "Divida o total pelo número de caixas, depois multiplique por 2.",
                    Clue = "A pessoa usa óculos e gosta de xadrez.",
                    SolutionExplanation = "12 dividido por 3 = 4; multiplicado por 2 = 8."
                }
            });

            m.Locations.Add(new Location
            {
                Name = "Laboratório",
                Description = "Frascos e um quadro com fórmulas.",
                Puzzle = new Puzzle
                {
                    Category = PuzzleCategory.Quimica,
                    Prompt = "Charada (Química): Você tem 2 L de solução A a 1 mol/L e mistura com 1 L de solução B a 2 mol/L (mesma substância). Qual a molaridade final? (apenas o número)",
                    AnswerNormalized = "4/3", 
                    Hint = "Use: M_total = (M1V1 + M2V2) / (V1+V2)",
                    Clue = "O suspeito trabalhou no turno da manhã.",
                    SolutionExplanation = "(2*1 + 1*2)/3 = 4/3 mol/L."
                }
            });

            m.Locations.Add(new Location
            {
                Name = "Cozinha",
                Description = "Cheiro de café e uma xícara quebrada.",
                Puzzle = new Puzzle
                {
                    Category = PuzzleCategory.Matematica,
                    Prompt = "Charada (Matemática): Resolva: 5 + (3 * 2) - 4 = ? (apenas o número)",
                    AnswerNormalized = "7",
                    Hint = "Siga a precedência das operações (multiplicação antes de soma/subtração).",
                    Clue = "Deixou uma luva no local.",
                    SolutionExplanation = "3*2=6; 5+6-4 = 7."
                }
            });

            m.Locations.Add(new Location
            {
                Name = "Sala de Estar",
                Description = "Sofá com almofadas embaralhadas.",
                Puzzle = new Puzzle
                {
                    Category = PuzzleCategory.Quimica,
                    Prompt = "Charada (Química): Se uma solução 10% m/v tem 5 g de soluto, qual é o volume em mL? (considere % m/v = g soluto / 100 mL solução)",
                    AnswerNormalized = "50",
                    Hint = "Rearranje: volume (mL) = (g soluto / (% m/v)) * 100",
                    Clue = "Usa perfume cheiroso no casaco.",
                    SolutionExplanation = "Volume = (5 / 10) * 100 = 50 mL."
                }
            });

            m.Locations.Add(new Location
            {
                Name = "Jardim",
                Description = "Plantas e um banco vazio.",
                Puzzle = null
            });

            return m;
        }

        public Location FindLocationByName(string partialName)
        {
            var p = partialName.Trim().ToLowerInvariant();
            return Locations.FirstOrDefault(l => l.Name.ToLowerInvariant().StartsWith(p) || l.Name.ToLowerInvariant().Contains(p));
        }

        public void PrintMap(Player player)
        {
            Console.WriteLine("Mapa: \n");
            foreach (var l in Locations)
            {
                var mark = l == player.CurrentLocation ? "(Você)" : "";
                var status = l.Puzzle == null ? "[vazio]" : (l.Puzzle.Solved ? "[resolvido]" : "[pista]");
                Console.WriteLine($"- {l.Name} {mark} - {status} - {l.Description}");
            }
            Console.WriteLine();
        }

        public int SolvedCount() => Locations.Count(l => l.Puzzle != null && l.Puzzle.Solved);
        public int TotalPuzzles() => Locations.Count(l => l.Puzzle != null);
        public bool AllPuzzlesSolved() => SolvedCount() == TotalPuzzles();
    }

    public class Location
    {
        public string Name { get; set; }
        public string Description { get; set; }
        public Puzzle Puzzle { get; set; }
    }

    public class Puzzle
    {
        public PuzzleCategory Category { get; set; }
        public string Prompt { get; set; }
        public string AnswerNormalized { get; set; } 
        public string Hint { get; set; }
        public string Clue { get; set; }
        public bool Solved { get; set; } = false;
        public string SolutionExplanation { get; set; }
        public DateTime? SolveTime { get; set; }

        public bool CheckAnswer(string attempt)
        {
            if (attempt == null) return false;
            var normalized = NormalizeAttempt(attempt);
            var expected = NormalizeAnswer(AnswerNormalized);
            return normalized == expected;
        }

        private string NormalizeAttempt(string s)
        {
            s = s.Trim().ToLowerInvariant();
            
            if (s.Contains(',')) s = s.Replace(',', '.');
            return s;
        }

        private string NormalizeAnswer(string s)
        {
            if (s == null) return "";
            s = s.Trim().ToLowerInvariant();
            if (s.Contains(',')) s = s.Replace(',', '.');
            return s;
        }

        public string RevealClue() => Clue;
        public string ShortResult()
        {
            return Solved ? $"{Clue}" : "(não resolvido)";
        }
    }

    public enum PuzzleCategory { Matemática, Quimica, Matematica, Química }

    public class Player
    {
        public Location CurrentLocation { get; set; }
    }

    public class Suspect
    {
        public string Name { get; set; }
        public string Description { get; set; }

        public static List<Suspect> SampleSuspects()
        {
            return new List<Suspect>
            {
                new Suspect { Name = "Carlos", Description = "Professor de química, costuma usar jaleco branco." },
                new Suspect { Name = "Mariana", Description = "Bibliotecária, usa óculos e ama xadrez." },
                new Suspect { Name = "Luiz", Description = "Cozinheiro, sempre com cheiro de café." }
            };
        }
    }
}
